import requests
import yfinance as yf
from datetime import datetime
import pytz
import time as pytime
import sys

# --- 設定 ---
URL_POST = "http://localhost:8080/market-index-candles"  # データ送信
URL_LATEST = "http://localhost:8080/market-index-candles/latest"  # 最新取得
RETRY_LIMIT = 3
JST = pytz.timezone("Asia/Tokyo")

# CME先物（シンボルとmarketTypeの対応）
CME_FUTURES = [
    {"symbol": "NKD=F", "marketType": "CME_NKD_USD"},
    {"symbol": "NIY=F", "marketType": "CME_NIY_YEN"},
]

# --- データ取得（1分足優先、無理なら日足） ---
def fetch_candles(symbol, lookback_days=5, start="2004-01-01"):
    ticker = yf.Ticker(symbol)

    # まず1分足を試す
    try:
        data = ticker.history(period=f"{lookback_days}d", interval="1m")
        if not data.empty:
            print(f"{symbol}: 1分足データ取得成功 ({len(data)}件)")
            granularity = "1m"
        else:
            raise ValueError("1分足データなし")
    except Exception:
        # 1分足取れない場合は日足
        data = ticker.history(start=start, interval="1d")
        if data.empty:
            print(f"{symbol}: データ取得不可")
            return None, None
        granularity = "1d"
        print(f"{symbol}: 日足データ取得 ({len(data)}件)")

    # JSTに変換
    if data.index.tz is None:
        data.index = data.index.tz_localize("UTC").tz_convert(JST)
    else:
        data.index = data.index.tz_convert(JST)

    # ソート & 重複排除
    data = data.sort_index()
    data = data[~data.index.duplicated()]
    return data, granularity


# --- 最新 timestamp 取得 ---
def get_latest_timestamp(symbol, market_type):
    try:
        response = requests.get(URL_LATEST, params={"symbol": symbol, "marketType": market_type})
        if response.status_code == 200:
            latest = response.json()
            return latest["timestamp"]
    except Exception as e:
        print(f"[{market_type}] 最新取得エラー: {e}")
    return None


# --- 送信 ---
def send_candle(payload):
    for attempt in range(RETRY_LIMIT):
        try:
            response = requests.post(URL_POST, json=payload)
            if response.status_code == 200:
                print(f"[{payload['marketType']}] {payload['timestamp']} 送信成功")
                return True
            else:
                print(f"[{payload['marketType']}] 送信失敗: {response.status_code} {response.text}")
        except Exception as e:
            print(f"[{payload['marketType']}] 送信エラー: {e}")
        pytime.sleep(1)
    return False


# --- メイン処理 ---
def process_cme_future(future):
    symbol = future["symbol"]
    market_type = future["marketType"]

    print(f">>> {market_type} ({symbol}) のデータ取得開始...")
    data, granularity = fetch_candles(symbol)

    if data is None:
        return

    latest_ts = get_latest_timestamp(symbol, market_type)

    for index, row in data.iterrows():
        ts_str = index.strftime("%Y-%m-%dT%H:%M:%S")
        if latest_ts and ts_str <= latest_ts:
            continue
        payload = {
            "symbol": symbol,
            "marketType": market_type,
            "timestamp": ts_str,
            "open": float(row['Open']),
            "high": float(row['High']),
            "low": float(row['Low']),
            "close": float(row['Close']),
            "volume": int(row['Volume']),
            "granularity": granularity  # 粒度情報も送信
        }
        send_candle(payload)


if __name__ == "__main__":
    start_date = None
    if len(sys.argv) > 1:
        start_date = sys.argv[1]  # 例: "2025-09-08"
    for future in CME_FUTURES:
        if start_date:
            data, granularity = fetch_candles(future["symbol"], start=start_date)
            latest_ts = get_latest_timestamp(future["symbol"], future["marketType"])
            for index, row in data.iterrows():
                ts_str = index.strftime("%Y-%m-%dT%H:%M:%S")
                if latest_ts and ts_str <= latest_ts:
                    continue
                payload = {
                    "symbol": future["marketType"],
                    "marketType": future["marketType"],
                    "timestamp": ts_str,
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']),
                    "granularity": granularity
                }
                send_candle(payload)
        else:
            process_cme_future(future)