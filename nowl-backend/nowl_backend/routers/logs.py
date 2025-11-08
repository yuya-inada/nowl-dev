# nowl-backend/nowl_backend/routers/logs.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from nowl_backend.database import get_db
from nowl_backend.models import EventSyncLog

router = APIRouter(prefix="/api/logs", tags=["Logs"])

@router.get("/event-sync")
def get_event_sync_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = (
        db.query(EventSyncLog)
        .order_by(EventSyncLog.executed_at.desc())
        .limit(limit)
        .all()
    )
    return logs