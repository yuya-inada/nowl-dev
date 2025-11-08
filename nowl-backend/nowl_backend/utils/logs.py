# nowl-backend/nowl_backend/utils/logs.py

import time
from datetime import datetime
from sqlalchemy import text
from nowl_backend.database import get_db

def log_event_sync(status, added=0, updated=0, deleted=0, duration=None, error=None):
    db = next(get_db())
    try:
        db.execute(text("""
            INSERT INTO event_sync_logs 
            (executed_at, status, added_count, updated_count, deleted_count, duration_seconds, error_message)
            VALUES (:executed_at, :status, :added, :updated, :deleted, :duration, :error)
        """), {
            "executed_at": datetime.now(),
            "status": status,
            "added": added,
            "updated": updated,
            "deleted": deleted,
            "duration": duration,
            "error": error
        })
        db.commit()
    finally:
        db.close()