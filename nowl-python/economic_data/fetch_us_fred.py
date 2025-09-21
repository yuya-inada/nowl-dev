# fetch_us_fred.py
import os
from dotenv import load_dotenv
load_dotenv("/Users/inadayuuya/nowl-dev/.env")
import pandas as pd
import requests
from datetime import datetime, timedelta
import pytz
import psycopg2
from save_to_db import save_indicator_to_db
import argparse

JST = pytz.timezone("Asia/Tokyo")
FRED_API_KEY = os.getenv("FRED_API_KEY")

DB_PARAMS = {
    "host": "localhost",
    "port": 5432,
    "dbname": "nowldb",
    "user": "inadayuuya",
    "password": "postgres",
}

def get_master_list(country_code="US"):
    """経済指標マスターテーブルから取得"""
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT country_code, country_name, series_id, indicator_name, latest_only, unit, frequency
        FROM economic_indicator_master
        WHERE country_code = %s
        ORDER BY id
    """, (country_code,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    master_list = []
    for row in rows:
        master_list.append({
            "country_code": row[0],
            "country_name": row[1],
            "series_id": row[2],
            "indicator_name": row[3],
            "latest_only": row[4],
            "unit": row[5],
            "frequency": row[6]
        })
    return master_list

def fetch_series(series_id, start_date=None, latest_only=False, frequency="d"):
    """FRED API からデータ取得"""
    end_date = datetime.today().strftime("%Y-%m-%d")
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
    }

    if latest_only:
        params["observation_start"] = (datetime.today() - timedelta(days=365)).strftime("%Y-%m-%d")
    else:
        params["observation_start"] = start_date if start_date else "2015-01-01"
    params["observation_end"] = end_date

    if frequency in ["q", "m", "w", "d"]:
        params["frequency"] = frequency

    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json().get("observations", [])
    df = pd.DataFrame(data)
    if df.empty:
        return df

    df["date"] = pd.to_datetime(df["date"]).dt.date
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df.rename(columns={"value": "actual_value"}, inplace=True)

    if latest_only and not df.empty:
        df = df.tail(1)

    return df[["date", "actual_value"]]

def fetch_and_save_all(user_start_date=None):
    master_list = get_master_list(country_code="US")
    for series in master_list:
        print(f">>> {series['indicator_name']} を取得中...")
        df = fetch_series(
            series_id=series["series_id"],
            start_date=user_start_date,
            latest_only=series.get("latest_only", False),
            frequency=series.get("frequency", "d")
        )
        if df.empty:
            print(f"{series['indicator_name']} データなし")
            continue

        # CLIで指定した開始日でフィルタ
        if user_start_date and not series.get("latest_only", False):
            user_start_date_obj = datetime.strptime(user_start_date, "%Y-%m-%d").date()
            df = df[df["date"] >= user_start_date_obj]

        # === 保存処理 ===
        if series["series_id"] == "CPIAUCNS":
            # CPI: 水準
            for i, row in df.iterrows():
                save_indicator_to_db(
                    date=row["date"],
                    country_code=series["country_code"],
                    country_name=series["country_name"],
                    indicator_name="米国CPI（指数）",
                    actual_value=row["actual_value"],
                    unit=""
                )
            # 前月比％
            df["mom"] = df["actual_value"].pct_change() * 100
            for i, row in df.iterrows():
                if i == 0:
                    continue
                save_indicator_to_db(
                    date=row["date"],
                    country_code=series["country_code"],
                    country_name=series["country_name"],
                    indicator_name="米国CPI（前月比％）",
                    actual_value=round(row["mom"], 2),
                    unit="%"
                )
            # 前年同月比％
            df["yoy"] = df["actual_value"].pct_change(12) * 100
            for i, row in df.iterrows():
                if i < 12:
                    continue
                save_indicator_to_db(
                    date=row["date"],
                    country_code=series["country_code"],
                    country_name=series["country_name"],
                    indicator_name="米国CPI（前年比％）",
                    actual_value=round(row["yoy"], 2),
                    unit="%"
                )
        else:
            # GDP 系などはそのまま保存
            for _, row in df.iterrows():
                save_indicator_to_db(
                    date=row["date"],
                    country_code=series["country_code"],
                    country_name=series["country_name"],
                    indicator_name=series["indicator_name"],
                    actual_value=row["actual_value"],
                    unit=series.get("unit", "")
                )

        print(f"{series['indicator_name']} 保存完了")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    args = parser.parse_args()
    fetch_and_save_all(user_start_date=args.start_date)