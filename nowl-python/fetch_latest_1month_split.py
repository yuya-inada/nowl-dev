# fetch_latest_1month_split.py
import requests
import yfinance as yf
from datetime import datetime, timedelta, time
import pytz
import time as pytime

# --- 設定 ---
URL_POST = "http://localhost:8080/market-index-candles"
URL_LATEST = "http://localhost:8080/market-index-candles/latest"
RETRY_LIMIT = 3
SLEEP_INTERVAL = 1  # 秒
JST = pytz.timezone("Asia/Tokyo")

# 対象市場リスト
MARKETS = [
    {"symbol": "^N225", "marketType": "N225"},
    {"symbol": "^TPX", "marketType": "TOPIX"},
    {"symbol": "JPY=X", "marketType": "USD/JPY"},
    {"symbol": "EURJPY=X", "marketType": "USD/EUR"},
    {"symbol": "^DJI", "marketType": "NYダウ"},
    {"symbol": "^GSPC", "marketType": "S&P500"},
    {"symbol": "^IXIC", "marketType": "NASDAQ"},
    {"symbol": "BTC-USD", "marketType": "BTC/USD"},
]

# 市場の昼休み（必要に応じて追加）
MARKET_BREAKS = {
    "N225": [(time(11, 30), time(12, 30))],
    "TOPIX": [(time(11, 30), time(12, 30))],
}

# --- データ取得 ---
def fetch_candles(symbol, start, end, interval="1m", market_type="N225"):
    ticker = yf.Ticker(symbol)
    data = ticker.history(start=start, end=end, interval=interval)
    if data.empty:
        print(f"{symbol}: データなし ({start}~{end})")
        return data

    # タイムゾーン変換
    if data.index.tz is None:
        data.index = data.index.tz_localize("UTC").tz_convert(JST)
    else:
        data.index = data.index.tz_convert(JST)

    # 昼休み除外
    breaks = MARKET_BREAKS.get(market_type, [])
    for start_time, end_time in breaks:
        data = data[~((data.index.time >= start_time) & (data.index.time < end_time))]

    # 重複削除
    data = data.sort_index()
    data = data[~data.index.duplicated()]

    return data

# --- 最新 timestamp 取得 ---
def get_latest_timestamp(symbol, market_type):
    try:
        response = requests.get(URL_LATEST, params={"symbol": symbol, "marketType": market_type})
        if response.status_code == 200:
            latest = response.json()
            return latest["timestamp"]
    except Exception as e:
        print(f"最新取得エラー: {e}")
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
                print(f"[{payload['marketType']}] {payload['timestamp']} 送信失敗: {response.status_code} {response.text}")
        except Exception as e:
            print(f"[{payload['marketType']}] {payload['timestamp']} 送信エラー: {e}")
        pytime.sleep(SLEEP_INTERVAL)
    return False

# --- 市場ごと処理 ---
def process_market(market, start_date, end_date):
    symbol = market["symbol"]
    market_type = market["marketType"]

    current_start = start_date
    while current_start < end_date:
        current_end = min(current_start + timedelta(days=8), end_date)
        data = fetch_candles(symbol, start=current_start.strftime("%Y-%m-%d"), end=current_end.strftime("%Y-%m-%d"),
                             interval="1m", market_type=market_type)
        if not data.empty:
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
                }
                send_candle(payload)
        current_start = current_end

# --- メイン ---
if __name__ == "__main__":
    end_day = datetime.now(JST)
    start_day = end_day - timedelta(days=30)  # 過去1か月

    print(f"=== 過去1か月分(8日ずつ)の1分足データ取得開始 ===")
    for market in MARKETS:
        print(f">>> {market['marketType']} 取得中...")
        process_market(market, start_day, end_day)
    print("=== 取得完了 ===")