import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from databases import Database
from fastapi.middleware.cors import CORSMiddleware

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nowluser:nowlowlione@db:5432/nowldb")
database = Database(DATABASE_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時の処理
    await database.connect()
    yield
    # 終了時の処理
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Nowl FastAPI backend is running!"}

@app.get("/dbtest")
async def db_test():
    query = "SELECT 1"
    result = await database.fetch_one(query)
    return {"result": result}

# 許可したいオリジン（Reactの開発サーバーURL）を指定
origins = [
    "http://localhost:5173",
]

@app.get("/")
async def root():
    return {"message": "Nowl FastAPI backend is running!"}