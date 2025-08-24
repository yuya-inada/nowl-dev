import requests
import yfinance as yf
from datetime import datetime

# --- 設定 ---
symbol = "^N225"         # Yahoo Finance シンボル
market_type = "N225"     # 任意の市場タイプ
url = "http://localhost:8080/market-index-candles"  # POST先

# --- データ取得 ---
ticker = yf.Ticker(symbol)
# 1日分の1分足
data = ticker.history(period="1d", interval="1m")

if data.empty:
    print("データが取得できませんでした")
    exit()

# --- データ送信 ---
for index, row in data.iterrows():
    payload = {
        "symbol": symbol,
        "marketType": market_type,
        "timestamp": index.strftime("%Y-%m-%dT%H:%M:%S"),
        "open": float(row['Open']),
        "high": float(row['High']),
        "low": float(row['Low']),
        "close": float(row['Close']),
        "volume": int(row['Volume'])
    }

    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"{payload['timestamp']} 送信成功")
        else:
            print(f"{payload['timestamp']} 送信失敗: {response.status_code} {response.text}")
    except Exception as e:
        print(f"{payload['timestamp']} 送信エラー: {e}")