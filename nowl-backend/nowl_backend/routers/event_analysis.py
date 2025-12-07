from fastapi import APIRouter, HTTPException
from nowl_backend.db import database

from nowl_backend.services.event_analysis.sync_event_master import (
    sync_event_master_logic
)

router = APIRouter()

@router.post("/sync_events", summary="economic_calendar → event_master 同期")
async def sync_event_master():
    try:
        return await sync_event_master_logic(database)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))