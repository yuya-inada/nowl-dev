# ------------------ 修正版 ------------------
import requests
import yfinance as yf
from datetime import datetime, time, timedelta
import pytz
import time as pytime
import argparse

# --- 設定 ---
URL_POST = "http://localhost:8080/market-index-candles"  # データ送信
URL_LATEST = "http://localhost:8080/market-index-candles/latest"  # 最新取得（重複チェック用）
SYMBOL = "^N225"
MARKET_TYPE = "N225"
RETRY_LIMIT = 3
SLEEP_INTERVAL = 60  # 秒単位
JST = pytz.timezone("Asia/Tokyo")

# 対象市場リスト（symbol = Yahoo!Financeティッカー, marketType = DB保存用ラベル）
MARKETS = [
    {"symbol": "^N225", "marketType": "N225"},
    {"symbol": "^TOPX", "marketType": "TOPIX"},
    {"symbol": "JPY=X", "marketType": "USD/JPY"},
    {"symbol": "EURJPY=X", "marketType": "USD/EUR"},
    {"symbol": "EURUSD=X", "marketType": "EUR/USD"},
    {"symbol": "^DJI", "marketType": "NYダウ"},
    {"symbol": "^GSPC", "marketType": "S&P500"},
    {"symbol": "^IXIC", "marketType": "NASDAQ"},
    {"symbol": "BTC-USD", "marketType": "BTC/USD"},
    # 先物や金利などは後で追加
]

# 市場の昼休み設定（必要に応じて追加）
MARKET_BREAKS = {
    "N225": [(time(11, 30), time(12, 30))],
    "TOPIX": [(time(11, 30), time(12, 30))],
    "CME": [],
    "NYSE": [],
}


# --- データ取得 ---
def fetch_candles(symbol, start=None, end=None, interval="1m", market_type="N225"):
    ticker = yf.Ticker(symbol)
    if start and end:
        data = ticker.history(start=start, end=end, interval=interval)
    else:
        data = ticker.history(period="1d", interval=interval)

    if data.empty:
        print(f"{symbol}: データが取得できませんでした (start={start}, end={end}, interval={interval})")
        return data

    # タイムゾーン変換
    if data.index.tz is None:  # tz-naiveの場合
        data.index = data.index.tz_localize("UTC").tz_convert(JST)
    else:  # tz-awareの場合
        data.index = data.index.tz_convert(JST)

    # ソート & 重複削除
    data = data.sort_index()
    data = data[~data.index.duplicated()]

    # 市場ごとの昼休みを除外
    breaks = MARKET_BREAKS.get(market_type, [])
    for start_time, end_time in breaks:
        data = data[~((data.index.time >= start_time) & (data.index.time < end_time))]

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
        pytime.sleep(1)
    return False

# --- 過去データ取得・送信 ---
def process_market(market, target_date):
    symbol = market["symbol"]
    market_type = market["marketType"]

    start_dt = target_date
    end_dt = target_date + timedelta(days=1)
    data = fetch_candles(symbol, start=start_dt.strftime("%Y-%m-%d"), end=end_dt.strftime("%Y-%m-%d"),
                         interval="1m", market_type=market_type)

    if data.empty:
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
            "volume": int(row['Volume'])
        }
        send_candle(payload)


# --- CLI ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="取得終了日(YYYY-MM-DD)")
    args = parser.parse_args()

    # 日付範囲指定
    start_day = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else datetime.now(JST)
    end_day = datetime.strptime(args.end_date, "%Y-%m-%d") if args.end_date else start_day

    current_day = start_day
    while current_day <= end_day:
        print(f"=== 取得対象日: {current_day.strftime('%Y-%m-%d')} ===")
        for market in MARKETS:
            print(f">>> {market['marketType']} データ取得中...")
            process_market(market, current_day)
        current_day += timedelta(days=1)

# ------------------ リアルタイム用ループ -------------------
# def realtime_loop():
#     while True:
#         today = datetime.now(JST)
#         if today.weekday() >= 5:  # 土日スキップ
#             pytime.sleep(SLEEP_INTERVAL)
#             continue
#
#         data = fetch_candles(SYMBOL, period="1d", interval="1m", market_type=MARKET_TYPE)
#         if data.empty:
#             pytime.sleep(SLEEP_INTERVAL)
#             continue
#
#         latest_ts = get_latest_timestamp(SYMBOL, MARKET_TYPE)
#
#         for index, row in data.iterrows():
#             ts_str = index.strftime("%Y-%m-%dT%H:%M:%S")
#             if latest_ts and ts_str <= latest_ts:
#                 continue
#
#             payload = {
#                 "symbol": SYMBOL,
#                 "marketType": MARKET_TYPE,
#                 "timestamp": ts_str,
#                 "open": float(row['Open']),
#                 "high": float(row['High']),
#                 "low": float(row['Low']),
#                 "close": float(row['Close']),
#                 "volume": int(row['Volume'])
#             }
#             send_candle(payload)
#
#         pytime.sleep(SLEEP_INTERVAL)
#
# if __name__ == "__main__":
#     realtime_loop()