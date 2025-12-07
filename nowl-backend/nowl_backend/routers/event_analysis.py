# nowl_backend/routers/event_analysis.py

from fastapi import APIRouter, HTTPException
from nowl_backend.main import database  # ★ main.py の database を使う

from nowl_backend.services.event_analysis.sync_event_master import (
    sync_event_master_logic
)

router = APIRouter()

# --------------------------
# 📌 イベント同期 API
# --------------------------
@router.post("/sync_events", summary="economic_calendar → event_master 同期")
async def sync_event_master():
    try:
        return await sync_event_master_logic(database)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync error: {e}")