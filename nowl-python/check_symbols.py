import yfinance as yf

symbols = ["^N225", "NKD=F", "^NI225M25.SG"]

for sym in symbols:
    print("=" * 40)
    print(f"シンボル: {sym}")
    try:
        t = yf.Ticker(sym)
        df = t.history(period="1d", interval="1m")
        if df.empty:
            print("⚠ データなし")
        else:
            print("✅ 行数:", len(df))
            print(df.head())  # 最初の5行だけ表示
    except Exception as e:
        print("❌ エラー:", e)