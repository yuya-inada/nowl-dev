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

    query = "SELECT * FROM market_index_candles WHERE market_type = :symbol"
    values = {"symbol": symbol}

    if from_dt:
        query += " AND timestamp >= :from_dt"
        values["from_dt"] = from_dt  # tz-naive datetime で渡す

    query += " ORDER BY timestamp ASC LIMIT :limit"
    values["limit"] = limit

    try:
        result = await database.fetch_all(query=query, values=values)
        return [dict(r) for r in result]  # 辞書リストで返す
    except Exception as e:
        print("DB取得エラー:", e)
        return {"error": str(e)}