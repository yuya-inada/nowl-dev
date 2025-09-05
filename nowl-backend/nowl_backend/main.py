import os
from fastapi import FastAPI, Query
from contextlib import asynccontextmanager
from databases import Database
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz

# --------------------------
# DB接続設定
# --------------------------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://nowluser:nowlowlione@localhost:5432/nowldb"
)
database = Database(DATABASE_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

# --------------------------
# FastAPI インスタンス
# --------------------------
app = FastAPI(lifespan=lifespan)

# --------------------------
# CORS 設定
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 開発サーバー
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# ルート確認
# --------------------------
@app.get("/")
async def root():
    return {"message": "Nowl FastAPI backend is running!"}

@app.get("/dbtest")
async def db_test():
    query = "SELECT 1"
    result = await database.fetch_one(query)
    return {"result": result}

# --------------------------
# チャート用データ取得
# --------------------------
@app.get("/market-index-candles")
async def get_candles(
    symbol: str = Query(...),  # React 側で送る 'N225', 'CME', 'NYSE'
    from_: str | None = Query(None, alias="from"),  # ?from=xxxx
    limit: int = Query(100),
    interval: str = Query("1d"),
):
    from_dt = None
    JST = pytz.timezone("Asia/Tokyo")

    if from_:
        try:
            # UTC文字列 → datetime → JSTに変換 → tz-naive にする
            from_dt = datetime.fromisoformat(from_.replace("Z", "+00:00"))
            from_dt = from_dt.astimezone(JST).replace(tzinfo=None)
        except Exception as e:
            print("from_変換エラー:", from_, e)
            from_dt = None

    # interval → PostgreSQL の date_trunc 単位にマッピング
    interval_map = {
        "1m" : 60,
        "2m" : 120,
        "3m" : 180,
        "5m" : 300,
        "10m": 600,
        "15m": 900,
        "30m": 1800,
        "60m": 3600,
        "1d" : 86400,
        "1w" : 604800,
        "1M" : 2592000,
    }
    # trunc_unit = interval_map.get(interval, "day")
    seconds = interval_map.get(interval, 86400)

    # SQLで丸め処理
    query = f"""
        WITH grouped AS (
            SELECT
                to_timestamp(floor(extract('epoch' from timestamp)/:seconds)*:seconds) AT TIME ZONE 'Asia/Tokyo' AS ts,
                symbol,
                MIN(timestamp) AS first_ts,
                MAX(timestamp) AS last_ts,
                MAX(high) AS high,
                MIN(low) AS low,
                SUM(volume) AS volume
            FROM market_index_candles
            WHERE symbol = :symbol
            {"AND timestamp >= :from_dt" if from_dt else ""}
            GROUP BY ts, symbol
        )
        SELECT 
            g.ts,
            (SELECT open FROM market_index_candles WHERE symbol = g.symbol AND timestamp = g.first_ts LIMIT 1) AS open,
            g.high,
            g.low,
            (SELECT close FROM market_index_candles WHERE symbol = g.symbol AND timestamp = g.last_ts LIMIT 1) AS close,
            g.volume
        FROM grouped g
        ORDER BY g.ts ASC
        LIMIT :limit
    """

    values = {"symbol": symbol, "seconds": seconds, "limit": limit}
    if from_dt:
        values["from_dt"] = from_dt

    try:
        result = await database.fetch_all(query=query, values=values)
        return [
            {
                "timestamp": r["ts"],
                "open": r["open"],
                "high": r["high"],
                "low": r["low"],
                "close": r["close"],
                "volume": r["volume"],
            }
            for r in result
        ]
    except Exception as e:
        print("DB取得エラー:", e)
        return {"error": str(e)}