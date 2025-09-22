# fetch_us_fred.py
# ・GDP　米国実質GDP（四半期・水準）
# ・A191RL1Q225SBEA　米国実質GDP（四半期・成長率）
# ・CPIAUCNS	米国CPI（指数）	
# ・PCEPI	米国個人消費支出価格指数（PCEデフレーター）	
# ・PPIACO　米国生産者物価指数（PPI）		
# ・PAYEMS	　米国非農業部門雇用者数
# ・UNRATE	　米国失業率
# ・PCE　米国個人消費支出（PCE）
# ・RRSFS　米国小売売上高
# ・INDPRO　米国鉱工業生産指数

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

def get_master_list(country_code="US", source="FRED"):
    """経済指標マスターテーブルから取得（デフォルトはFREDのみ）"""
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT country_code, country_name, series_id, indicator_name, latest_only,
               unit, frequency, calc_mom, calc_yoy, source
        FROM economic_indicator_master
        WHERE country_code = %s AND source = %s
        ORDER BY id
    """, (country_code, source))
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
            "frequency": row[6],
            "calc_mom": row[7],
            "calc_yoy": row[8],
            "source": row[9],
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
        params["observation_start"] = start_date if start_date else "2000-01-01"
    params["observation_end"] = end_date

    # frequency を反映
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
    return df[["date", "actual_value"]]

def fetch_and_save_all(user_start_date=None):
    # FRED のみ
    master_list = get_master_list(country_code="US", source="FRED")

    for series in master_list:
        print(f">>> {series['indicator_name']} を取得中...")

        try:
            df = fetch_series(
                series_id=series["series_id"],
                start_date=user_start_date,
                latest_only=series.get("latest_only", False),
                frequency=series.get("frequency", "d")
            )
            if df.empty:
                print(f"{series['indicator_name']} データなし（スキップ）")
                continue

        except requests.exceptions.HTTPError as e:
            print(f"{series['indicator_name']} 取得エラー（スキップ）: {e}")
            continue
        except Exception as e:
            print(f"{series['indicator_name']} その他のエラー（スキップ）: {e}")
            continue

        # ここから保存処理…
        df = df.sort_values("date").reset_index(drop=True)

        if series.get("calc_mom", False):
            df["mom"] = df["actual_value"].pct_change(1) * 100
        if series.get("calc_yoy", False):
            periods = 12 if series.get("frequency") == "m" else 4
            df["yoy"] = df["actual_value"].pct_change(periods) * 100

        if user_start_date:
            start_date_obj = datetime.strptime(user_start_date, "%Y-%m-%d").date()
            df_to_save = df[df["date"] >= start_date_obj]
        else:
            df_to_save = df

        for _, row in df_to_save.iterrows():
            save_indicator_to_db(
                date=row["date"],
                country_code=series["country_code"],
                country_name=series["country_name"],
                indicator_name=series["indicator_name"],
                actual_value=row["actual_value"],
                unit=series.get("unit", "")
            )
            if series.get("calc_mom", False) and not pd.isna(row.get("mom")):
                save_indicator_to_db(
                    date=row["date"],
                    country_code=series["country_code"],
                    country_name=series["country_name"],
                    indicator_name=f"{series['indicator_name']}（前月比％）",
                    actual_value=round(row["mom"], 2),
                    unit="%"
                )
            if series.get("calc_yoy", False) and not pd.isna(row.get("yoy")):
                save_indicator_to_db(
                    date=row["date"],
                    country_code=series["country_code"],
                    country_name=series["country_name"],
                    indicator_name=f"{series['indicator_name']}（前年比％）",
                    actual_value=round(row["yoy"], 2),
                    unit="%"
                )

        print(f"{series['indicator_name']} 保存完了")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    args = parser.parse_args()
    fetch_and_save_all(user_start_date=args.start_date)