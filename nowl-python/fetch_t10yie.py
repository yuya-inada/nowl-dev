# --- fetch_t10yie.py FRED API版 ---
import requests
import pandas as pd
from datetime import datetime, timedelta
import pytz
import os

JST = pytz.timezone("Asia/Tokyo")
FRED_API_KEY = os.getenv("FRED_API_KEY")
SERIES_ID = "T10YIE"

def fetch_t10yie(target_date):
    """
    target_date: datetime.date または datetime.datetime
    戻り値: pandas DataFrame
    """
    start_str = target_date.strftime("%Y-%m-%d")
    end_str = (target_date + timedelta(days=1)).strftime("%Y-%m-%d")

    url = f"https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": SERIES_ID,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "observation_start": start_str,
        "observation_end": end_str,
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"FRED API エラー: {response.status_code}")
        return pd.DataFrame()

    data_json = response.json().get("observations", [])
    if not data_json:
        print(f"{SERIES_ID}: データが取得できませんでした")
        return pd.DataFrame()

    # DataFrame に変換
    df = pd.DataFrame(data_json)
    df["date"] = pd.to_datetime(df["date"])
    df.set_index("date", inplace=True)
    df.index = df.index.tz_localize("UTC").tz_convert(JST)
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df = df.rename(columns={"value": "Close"})
    df = df.sort_index()
    return df