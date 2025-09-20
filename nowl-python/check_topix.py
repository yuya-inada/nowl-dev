import yfinance as yf

# ここを試す: "^TOPX" または "^TPX"
ticker_symbol = "^TPX"  

ticker = yf.Ticker(ticker_symbol)

# 過去5日分の日足データを取得
data = ticker.history(period="5d", interval="1d")

if data.empty:
    print(f"{ticker_symbol}: データが取得できませんでした")
else:
    print(f"{ticker_symbol} 1時間足データ取得成功！")
    print(data)