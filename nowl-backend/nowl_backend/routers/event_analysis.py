# nowl-backend/nowl_backend/routers/event_analysis.py

from fastapi import APIRouter, HTTPException
from contextlib import asynccontextmanager
from databases import Database
import os
from dotenv import load_dotenv

# 💡 追加：サービスのロジックを呼び出す
from nowl_backend.services.event_analysis.sync_event_master import (
    sync_event_master_logic
)

load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

database = Database(DATABASE_URL)
router = APIRouter()

# FastAPI lifespan
@asynccontextmanager
async def lifespan(app):
    await database.connect()
    yield
    await database.disconnect()

router.lifespan_context = lifespan

# --------------------------
# 📌 イベント同期 API
# --------------------------
@router.post("/sync_events", summary="economic_calendar → event_master 同期")
async def sync_event_master():
    try:
        result = await sync_event_master_logic()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync error: {e}")