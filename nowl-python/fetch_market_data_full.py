# fetch_market_data_full_with_cme.py
# 統合版：CME先物(NKD=F, NIY=F) を含めた market data 取得＆POST送信スクリプト
import requests
import yfinance as yf
from datetime import datetime, time, timedelta
import pytz
import time as pytime
import argparse

# --- 設定 ---
URL_POST = "http://localhost:8080/market-index-candles"  # データ送信
URL_LATEST = "http://localhost:8080/market-index-candles/latest"  # 最新取得（重複チェック用）
RETRY_LIMIT = 3
SLEEP_INTERVAL = 60  # 秒単位（未使用のリアルタイムループ用）
JST = pytz.timezone("Asia/Tokyo")

# 対象市場リスト（symbol = Yahoo!Financeティッカー, marketType = DB保存用ラベル）
MARKETS = [
    {"symbol": "^N225", "marketType": "N225"},
    {"symbol": "^TPX", "marketType": "TOPIX"},
    {"symbol": "JPY=X", "marketType": "USD/JPY"},
    {"symbol": "EURJPY=X", "marketType": "EUR/JPY"},
    {"symbol": "EURUSD=X", "marketType": "USD/EUR"},
    {"symbol": "^DJI", "marketType": "NYダウ"},
    {"symbol": "^GSPC", "marketType": "S&P500"},
    {"symbol": "^IXIC", "marketType": "NASDAQ"},
    {"symbol": "BTC-USD", "marketType": "BTC/USD"},
    {"symbol": "^TNX", "marketType": "米長期金利"},
    # CME先物
    {"symbol": "NKD=F", "marketType": "CME_NKD_USD"},
    {"symbol": "NIY=F", "marketType": "CME_NIY_YEN"},
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
    try:
        if start and end:
            data = ticker.history(start=start, end=end, interval=interval)
        else:
            data = ticker.history(period="1d", interval=interval)
    except Exception as e:
        print(f"{symbol}: yfinance 取得エラー: {e}")
        return None

    if data is None or data.empty:
        print(f"{symbol}: データが取得できませんでした (start={start}, end={end}, interval={interval})")
        return None

    # タイムゾーン変換（JSTに揃える）
    try:
        if data.index.tz is None:  # tz-naiveの場合
            data.index = data.index.tz_localize("UTC").tz_convert(JST)
        else:  # tz-awareの場合
            data.index = data.index.tz_convert(JST)
    except Exception as e:
        print(f"{symbol}: tz変換エラー: {e}")
        # 続行は試みるが、問題あればNone返す
        return None

    # ソート & 重複削除
    data = data.sort_index()
    data = data[~data.index.duplicated()]

    # 市場ごとの昼休みを除外
    breaks = MARKET_BREAKS.get(market_type, [])
    for start_time, end_time in breaks:
        data = data[~((data.index.time >= start_time) & (data.index.time < end_time))]

    return data

# --- 最新 timestamp 取得 (単一引数) ---
def get_latest_timestamp(market_type):
    """
    FastAPI 側 /market-index-candles/latest を想定して market_type を渡す。
    サーバーが期待するパラメータ名に合わせて params を設定しています。
    """
    try:
        resp = requests.get(URL_LATEST, params={"symbol": market_type, "marketType": market_type}, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            # サーバーが直接タイムスタンプ文字列を返す前提
            return data.get("timestamp")
    except Exception as e:
        print(f"[{market_type}] 最新取得エラー: {e}")
    return None

# --- 送信 ---
def send_candle(payload):
    for attempt in range(RETRY_LIMIT):
        try:
            response = requests.post(URL_POST, json=payload, timeout=10)
            if response.status_code == 200:
                print(f"[{payload['marketType']}] {payload['timestamp']} 送信成功")
                return True
            else:
                print(f"[{payload['marketType']}] 送信失敗: {response.status_code} {response.text}")
        except Exception as e:
            print(f"[{payload['marketType']}] 送信エラー: {e}")
        pytime.sleep(1)
    return False

# --- 過去データ取得・送信 ---
def process_market(market, target_date):
    yf_symbol = market["symbol"]
    db_symbol = market["marketType"]

    start_dt = target_date
    end_dt = target_date + timedelta(days=1)
    data = fetch_candles(
        yf_symbol,
        start=start_dt.strftime("%Y-%m-%d"),
        end=end_dt.strftime("%Y-%m-%d"),
        interval="1m",
        market_type=db_symbol
    )

    if data is None or data.empty:
        return

    latest_ts = get_latest_timestamp(db_symbol)
    # 米長期金利の最新を必要なら保管する（変数定義しておく）
    tnx_close_latest = None

    for index, row in data.iterrows():
        ts_str = index.strftime("%Y-%m-%dT%H:%M:%S")
        if latest_ts and ts_str <= latest_ts:
            continue
        # Volume が nan の可能性があるので int キャスト前に保護
        vol = row.get('Volume', 0)
        try:
            vol_int = int(vol) if not (vol is None or (isinstance(vol, float) and (vol != vol))) else 0
        except Exception:
            vol_int = 0

        payload = {
            "symbol": db_symbol,        # DB の symbol と一致させる
            "marketType": db_symbol,
            "timestamp": ts_str,
            "open": float(row['Open']) if row.get('Open') is not None else None,
            "high": float(row['High']) if row.get('High') is not None else None,
            "low": float(row['Low']) if row.get('Low') is not None else None,
            "close": float(row['Close']) if row.get('Close') is not None else None,
            "volume": vol_int
        }
        send_candle(payload)

        if db_symbol == "米長期金利":
            try:
                tnx_close_latest = float(row['Close'])
            except Exception:
                tnx_close_latest = None

# --- CLI ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="取得終了日(YYYY-MM-DD)")
    args = parser.parse_args()

    JST_NOW = datetime.now(JST)
    start_day = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else JST_NOW
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