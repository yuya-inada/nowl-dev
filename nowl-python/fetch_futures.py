import yfinance as yf
import pytz
from datetime import datetime, timedelta

JST = pytz.timezone("Asia/Tokyo")

# 先物系ティッカー候補
FUTURES = {
    "Nikkei225 Large (OSE)": "NI225.FUT",   # ← 大証の日経225先物（ティッカー候補）
    "Nikkei225 Mini (OSE)": "NI225M.FUT",   # ← 大証のミニ（日経225ミニ先物）
    "Nikkei225 Futures (CME USD)": "NKD=F", # ← シカゴCME（日経225先物USD建て）
    "Nikkei225 Futures (CME Yen)": "NIY=F", # ← シカゴCME（日経225先物円建て）
}

def fetch_daily(symbol, days=5):
    ticker = yf.Ticker(symbol)
    try:
        data = ticker.history(period=f"{days}d", interval="1d")
        if data.empty:
            print(f"{symbol}: データ取得できず")
        else:
            print(f"\n=== {symbol} 過去{days}日 ===")
            print(data.tail())
    except Exception as e:
        print(f"{symbol}: 取得エラー {e}")

if __name__ == "__main__":
    for name, symbol in FUTURES.items():
        print(f">>> {name} ({symbol}) を取得中...")
        fetch_daily(symbol, days=5)