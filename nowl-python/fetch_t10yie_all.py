# fetch_t10yie_all.py
import requests
import pandas as pd
from datetime import datetime, timedelta
import pytz
import os

JST = pytz.timezone("Asia/Tokyo")
FRED_API_KEY = os.getenv("FRED_API_KEY")
SERIES_ID = "T10YIE"
CSV_FILE = "T10YIE_all.csv"

start_date = datetime(1990, 1, 1)
end_date = datetime.today()

url = f"https://api.stlouisfed.org/fred/series/observations"
params = {
    "series_id": SERIES_ID,
    "api_key": FRED_API_KEY,
    "file_type": "json",
    "observation_start": start_date.strftime("%Y-%m-%d"),
    "observation_end": end_date.strftime("%Y-%m-%d"),
}

response = requests.get(url, params=params)
if response.status_code != 200:
    print(f"FRED API エラー: {response.status_code}")
    exit(1)

data_json = response.json().get("observations", [])
df = pd.DataFrame(data_json)
df["date"] = pd.to_datetime(df["date"])
df.set_index("date", inplace=True)
df.index = df.index.tz_localize("UTC").tz_convert(JST)
df["value"] = pd.to_numeric(df["value"], errors="coerce")
df = df.rename(columns={"value": "Close"})
df = df.sort_index()

df.to_csv("T10YIE_all.csv")
print(f"CSVに保存しました: {len(df)} 行")