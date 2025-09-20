# calc_real_tate_csv.py
import pandas as pd
from datetime import datetime, timedelta
import pytz
import requests
import time as pytime
import argparse

# --- 設定 ---
URL_POST = "http://localhost:8080/market-index-candles"
URL_CHECK = "http://localhost:8080/market-index-candles"
RETRY_LIMIT = 3
SLEEP_INTERVAL = 60
JST = pytz.timezone("Asia/Tokyo")

TNX_SYMBOL = "^TNX"
TNX_MARKET_TYPE = "米長期金利"

T10YIE_SYMBOL = "^T10YIE"
T10YIE_MARKET_TYPE = "10年期待インフレ率"

REAL_MARKET_TYPE = "実質金利"

CSV_FILE = "T10YIE_all.csv"  # 事前に FRED から取得済みの CSV

# --- 送信（重複チェック：日付＋シンボル） ---
def send_candle(payload):
    headers = {
        "User-Agent": "curl/7.64.1",
        "Accept": "*/*",
        "Content-Type": "application/json",
    }

    try:
        date_str = payload["timestamp"][:10]
        check_resp = requests.get(URL_CHECK, params={"symbol": payload["symbol"], "date": date_str})
        if check_resp.status_code == 200:
            existing = check_resp.json()
            if existing and len(existing) > 0:
                print(f"[{payload['marketType']}] {payload['timestamp']} は既に存在するため送信スキップ")
                return False
    except Exception as e:
        print(f"[{payload['marketType']}] 重複チェックエラー: {e}")

    for attempt in range(RETRY_LIMIT):
        try:
            response = requests.post(URL_POST, json=payload, headers=headers)
            if response.status_code == 200:
                print(f"[{payload['marketType']}] {payload['timestamp']} 送信成功")
                return True
            elif response.status_code == 403:
                print(f"[{payload['marketType']}] {payload['timestamp']} 送信失敗: 403 Forbidden → スキップ")
                return False
            else:
                print(f"[{payload['marketType']}] {payload['timestamp']} 送信失敗: {response.status_code} {response.text}")
        except Exception as e:
            print(f"[{payload['marketType']}] {payload['timestamp']} 送信エラー: {e}")
        pytime.sleep(1)
    return False

# --- T10YIE データ取得（CSV版） ---
def fetch_t10yie_csv(target_date):
    df = pd.read_csv(CSV_FILE, parse_dates=["date"])
    df = df.rename(columns={"value": "Close"})
    df = df.set_index("date")

    # タイムゾーン調整
    if df.index.tz is None:
        df.index = df.index.tz_localize("UTC").tz_convert(JST)
    else:
        df.index = df.index.tz_convert(JST)

    df = df.sort_index()
    df = df[~df.index.duplicated()]

    # 対象日のデータだけ抽出
    day_str = target_date.strftime("%Y-%m-%d")
    day_df = df.loc[day_str:day_str]
    return day_df

# --- 米長期金利取得 ---
def fetch_tnx(target_date):
    import yfinance as yf
    ticker = yf.Ticker(TNX_SYMBOL)
    start_dt = target_date
    end_dt = target_date + timedelta(days=1)
    data = ticker.history(start=start_dt.strftime("%Y-%m-%d"), end=end_dt.strftime("%Y-%m-%d"), interval="1d")

    if data.empty:
        print(f"{TNX_SYMBOL}: データが取得できませんでした")
        return None

    if data.index.tz is None:
        data.index = data.index.tz_localize("UTC").tz_convert(JST)
    else:
        data.index = data.index.tz_convert(JST)

    data = data.sort_index()
    data = data[~data.index.duplicated()]
    return data

# --- T10YIE 送信 ---
def process_t10yie(target_date):
    t10yie_data = fetch_t10yie_csv(target_date)
    if t10yie_data.empty:
        return

    close = t10yie_data['Close'].iloc[-1]
    payload = {
        "symbol": T10YIE_SYMBOL,
        "marketType": T10YIE_MARKET_TYPE,
        "timestamp": target_date.strftime("%Y-%m-%dT%H:%M:%S"),
        "open": close,
        "high": close,
        "low": close,
        "close": close,
        "volume": 0
    }
    send_candle(payload)
    print(f"[{T10YIE_MARKET_TYPE}] {close:.2f} 送信完了")

# --- 実質金利計算・送信 ---
def process_real_rate(target_date):
    tnx_data = fetch_tnx(target_date)
    t10yie_data = fetch_t10yie_csv(target_date)

    if tnx_data is None or t10yie_data.empty:
        return

    tnx_close = tnx_data['Close'].iloc[-1]
    t10yie_close = t10yie_data['Close'].iloc[-1]
    real_rate = tnx_close - t10yie_close

    payload = {
        "symbol": "REAL_RATE",
        "marketType": REAL_MARKET_TYPE,
        "timestamp": target_date.strftime("%Y-%m-%dT%H:%M:%S"),
        "open": real_rate,
        "high": real_rate,
        "low": real_rate,
        "close": real_rate,
        "volume": 0
    }
    send_candle(payload)
    print(f"[{REAL_MARKET_TYPE}] {real_rate:.3f} 送信完了")

# --- CLI ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="取得終了日(YYYY-MM-DD)")
    args = parser.parse_args()

    start_day = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else datetime.now(JST)
    end_day = datetime.strptime(args.end_date, "%Y-%m-%d") if args.end_date else start_day

    current_day = start_day
    while current_day <= end_day:
        print(f"=== 対象日: {current_day.strftime('%Y-%m-%d')} ===")
        process_t10yie(current_day)
        process_real_rate(current_day)
        current_day += timedelta(days=1)