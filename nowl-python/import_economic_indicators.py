# import_economic_indicators.py
import pandas as pd
from datetime import datetime, timedelta
import pytz
import requests
import time as pytime
import argparse

# --- 設定 ---
CSV_FILE = "./data/economic_indicators.csv"
URL_POST = "http://localhost:8081/economic-indicators"  # FastAPI側のエンドポイント
URL_CHECK = URL_POST
RETRY_LIMIT = 3
SLEEP_INTERVAL = 1
JST = pytz.timezone("Asia/Tokyo")

# --- 送信（重複チェック） ---
def send_indicator(payload):
    headers = {
        "User-Agent": "curl/7.64.1",
        "Accept": "*/*",
        "Content-Type": "application/json",
    }

    # 重複チェック
    try:
        check_resp = requests.get(URL_CHECK, params={
            "date": payload["date"],
            "indicator_name": payload["indicator_name"],
            "country_code": payload["country_code"]
        })
        if check_resp.status_code == 200:
            existing = check_resp.json()
            if existing and len(existing) > 0:
                print(f"[{payload['country_code']}] {payload['indicator_name']} {payload['date']} は既に存在するため送信スキップ")
                return False
    except Exception as e:
        print(f"重複チェックエラー: {e}")

    # POST送信
    for attempt in range(RETRY_LIMIT):
        try:
            response = requests.post(URL_POST, json=payload, headers=headers)
            if response.status_code == 200:
                print(f"[{payload['country_code']}] {payload['indicator_name']} {payload['date']} 送信成功")
                return True
            else:
                print(f"送信失敗: {response.status_code} {response.text}")
        except Exception as e:
            print(f"送信エラー: {e}")
        pytime.sleep(SLEEP_INTERVAL)
    return False

# --- CSV読み込み ---
def load_csv():
    df = pd.read_csv(CSV_FILE)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date')
    df = df[~df.duplicated(subset=['date', 'indicator_name', 'country_code'])]
    return df

# --- payload整形（NaN安全＆送信安全版） ---
def clean_payload(row):
    def to_float(val):
        if pd.isna(val) or val in ("", "-", None):
            return None
        try:
            return float(val)
        except:
            return None

    payload = {
        "date": row["date"].strftime("%Y-%m-%d"),
        "country_code": row["country_code"],
        "indicator_name": row["indicator_name"],
    }

    # optional fields
    if pd.notna(row.get("time")):
        try:
            payload["time"] = row.get("time").strftime("%H:%M:%S")
        except:
            pass
    if pd.notna(row.get("country_name")):
        payload["country_name"] = row.get("country_name")
    for key in ["actual_value", "forecast_value", "previous_value"]:
        val = to_float(row.get(key))
        if val is not None:
            payload[key] = val
    if pd.notna(row.get("importance")):
        try:
            payload["importance"] = int(row.get("importance"))
        except:
            pass
    if pd.notna(row.get("unit")):
        payload["unit"] = row.get("unit")

    print("DEBUG payload:", payload)
    return payload

# --- データ送信 ---
def process_indicators(start_date, end_date):
    df = load_csv()
    current_day = start_date
    while current_day <= end_date:
        day_df = df[df['date'] == current_day]
        for _, row in day_df.iterrows():
            payload = clean_payload(row)
            send_indicator(payload)
        current_day += timedelta(days=1)

# --- CLI ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="取得終了日(YYYY-MM-DD)")
    args = parser.parse_args()

    start_day = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else datetime.now(JST)
    end_day = datetime.strptime(args.end_date, "%Y-%m-%d") if args.end_date else start_day

    process_indicators(start_day, end_day)