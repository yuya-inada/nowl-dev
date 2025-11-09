# fetch_market_data_full.py
# 統合版：CME先物(NKD=F, NIY=F) を含めた market data 取得＆POST送信スクリプト
import uuid
import requests
import yfinance as yf
from datetime import datetime, time, timedelta
import pytz
import time as pytime
import argparse
import psycopg2
import os
from dotenv import load_dotenv

# --- 設定 ---
URL_POST = "http://localhost:8080/market-index-candles"
URL_LATEST = "http://localhost:8080/market-index-candles/latest"
RETRY_LIMIT = 3
SLEEP_INTERVAL = 60
JST = pytz.timezone("Asia/Tokyo")

# --- DB設定 ---
load_dotenv("/Users/inadayuuya/nowl-dev/.env")
DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", 5432)),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

# --- ログ用関数 ---
def start_market_log(cur, market_name, symbol, interval):
    cur.execute("""
        INSERT INTO market_data_logs (market_name, symbol, interval, fetch_start, status, created_at, log_time)
        VALUES (%s, %s, %s, now(), %s, now(), now())
        RETURNING id
    """, (market_name, symbol, interval, 'START'))
    return cur.fetchone()[0]

def update_market_log(cur, log_id, status='SUCCESS', data_count=None, error_message=None, market_datatime=None):
    cur.execute("""
        UPDATE market_data_logs
        SET fetch_end = now(),
            status = %s,
            data_count = %s,
            error_message = %s,
            market_datatime = COALESCE(%s, market_datatime),
            log_time = now()
        WHERE id = %s
    """, (status, data_count, error_message, market_datatime, log_id))

def insert_info_log(cur, process_id, message, progress=0, market_datatime=None):
    cur.execute("""
        INSERT INTO market_data_logs (market_name, symbol, interval, fetch_start, status, error_message, process_id, progress, created_at, log_time, market_datatime)
        VALUES (%s, %s, %s, now(), %s, %s, %s, %s, now(), now(), %s)
    """, ("SYSTEM", "INFO", "1m", "INFO", message, process_id, progress, market_datatime))

def insert_complete_log(cur, process_id):
    cur.execute("""
        INSERT INTO market_data_logs (market_name, symbol, interval, fetch_start, status, error_message, process_id, progress, created_at, log_time)
        VALUES (%s, %s, %s, now(), %s, %s, %s, %s, now(), now())
    """, ("SYSTEM", "ALL", "1m", "COMPLETE", "全市場データ取得完了", process_id, 100))

# --- 対象市場 ---
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
    {"symbol": "NKD=F", "marketType": "CME_NKD_USD"},
    {"symbol": "NIY=F", "marketType": "CME_NIY_YEN"},
]

# --- 市場の昼休み設定 ---
MARKET_BREAKS = {
    "N225": [(time(11, 30), time(12, 30))],
    "TOPIX": [(time(11, 30), time(12, 30))],
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

    try:
        if data.index.tz is None:
            data.index = data.index.tz_localize("UTC").tz_convert(JST)
        else:
            data.index = data.index.tz_convert(JST)
    except Exception as e:
        print(f"{symbol}: tz変換エラー: {e}")
        return None

    data = data.sort_index()
    data = data[~data.index.duplicated()]

    breaks = MARKET_BREAKS.get(market_type, [])
    for start_time, end_time in breaks:
        data = data[~((data.index.time >= start_time) & (data.index.time < end_time))]

    return data

# --- 最新 timestamp 取得 ---
def get_latest_timestamp(market_type):
    try:
        resp = requests.get(URL_LATEST, params={"symbol": market_type, "marketType": market_type}, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("timestamp")
    except Exception as e:
        print(f"[{market_type}] 最新取得エラー: {e}")
    return None

# --- POST送信 ---
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

# --- メイン処理 ---
def process_market(market, target_date, conn, process_id, i, total):
    yf_symbol = market["symbol"]
    db_symbol = market["marketType"]
    interval = "1m"
    cur = conn.cursor()
    log_id = None

    try:
        log_id = start_market_log(cur, market_name=db_symbol, symbol=yf_symbol, interval=interval)
        conn.commit()

        start_dt = target_date
        end_dt = target_date + timedelta(days=1)
        data = fetch_candles(yf_symbol, start=start_dt.strftime("%Y-%m-%d"), end=end_dt.strftime("%Y-%m-%d"),
                             interval=interval, market_type=db_symbol)

        if data is None or data.empty:
            update_market_log(cur, log_id, status="FAILED", data_count=0, error_message="データ空または取得失敗")
            conn.commit()
            insert_info_log(cur, process_id, f"{db_symbol} (⚠️{i}/{total}) データ取得失敗",
                            progress=int(i/total*100), market_datatime=None)
            conn.commit()
            return

        data = data[data.index.date == target_date.date()]
        latest_ts = get_latest_timestamp(db_symbol)
        sent_timestamps = set()
        sent_count = 0

        for index, row in data.iterrows():
            ts_str = index.strftime("%Y-%m-%dT%H:%M:%S")
            if latest_ts and ts_str <= latest_ts:
                continue
            if ts_str in sent_timestamps:
                continue

            vol = row.get('Volume', 0)
            try:
                vol_int = int(vol) if not (vol is None or (isinstance(vol, float) and (vol != vol))) else 0
            except Exception:
                vol_int = 0

            payload = {
                "symbol": db_symbol,
                "marketType": db_symbol,
                "timestamp": ts_str,
                "open": float(row['Open']) if row.get('Open') is not None else None,
                "high": float(row['High']) if row.get('High') is not None else None,
                "low": float(row['Low']) if row.get('Low') is not None else None,
                "close": float(row['Close']) if row.get('Close') is not None else None,
                "volume": vol_int
            }
            success = send_candle(payload)
            if success:
                sent_timestamps.add(ts_str)
                sent_count += 1

        # data の処理が終わった後
        if data is not None and not data.empty:
            latest_dt = data.index.max()
        else:
            latest_dt = None

        # SUCCESS 更新時に market_datatime を入れる
        update_market_log(cur, log_id, status="SUCCESS", data_count=sent_count, market_datatime=latest_dt)
        conn.commit()

        # INFOログにも market_datatime を入れる
        insert_info_log(cur, process_id, f"{db_symbol} (✅{i}/{total}) を取得完了",
                        progress=int(i/total*100), market_datatime=latest_dt)
        conn.commit()

    except Exception as e:
        print(f"[{db_symbol}] エラー: {e}")
        if log_id:
            update_market_log(cur, log_id, status="FAILED", data_count=0, error_message=str(e))
            conn.commit()
            insert_info_log(cur, process_id, f"{db_symbol} (⚠️{i}/{total}) 取得中にエラー: {e}",
                            progress=int(i/total*100), market_datatime=None)
            conn.commit()
    finally:
        cur.close()

# --- CLI ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, help="取得開始日(YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="取得終了日(YYYY-MM-DD)")
    args = parser.parse_args()

    JST_NOW = datetime.now(JST)
    start_day = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else JST_NOW
    end_day = datetime.strptime(args.end_date, "%Y-%m-%d") if args.end_date else start_day

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    process_id = uuid.uuid4()

    current_day = start_day
    while current_day <= end_day:
        print(f"=== 取得対象日: {current_day.strftime('%Y-%m-%d')} ===")
        total = len(MARKETS)

        for i, market in enumerate(MARKETS, 1):
            progress = int(i / total * 100)
            if i == total:
                progress = 100

            insert_info_log(cur, process_id, f"現在 {market['marketType']} ({i}/{total}) を取得中...", progress)
            conn.commit()

            print(f">>> {market['marketType']} データ取得中...")
            try:
                process_market(market, current_day, conn, process_id, i, total)
            except Exception as e:
                error_message = str(e).replace("'", "")[:200]
                insert_info_log(cur, process_id,
                                f"{market['marketType']} (⚠️{i}/{total}) 取得中にエラー: {error_message}",
                                progress)
                conn.commit()
                continue

        insert_complete_log(cur, process_id)
        conn.commit()
        current_day += timedelta(days=1)

    cur.close()
    conn.close()