# nowl-backend/nowl_backend/utils/logs.py

import time
from datetime import datetime
from sqlalchemy import text
from nowl_backend.database import get_db

def log_event_sync(status, added=0, updated=0, deleted=0, duration=None, error=None, action="Sync Events"):
    # action を「機能名: 詳細」の形式と仮定
    feature_name = action.split(":")[0] if ":" in action else action
    action_detail = action  # 元の文字列は詳細として保持

    db = next(get_db())
    try:
        db.execute(text("""
            INSERT INTO event_sync_logs 
            (executed_at, status, added_count, updated_count, deleted_count, duration_seconds, error_message, action, feature_name, action_detail)
            VALUES (:executed_at, :status, :added, :updated, :deleted, :duration, :error, :action, :feature_name, :action_detail)
        """), {
            "executed_at": datetime.now(),
            "status": status,
            "added": added,
            "updated": updated,
            "deleted": deleted,
            "duration": duration,
            "error": error,
            "action": feature_name,        # フロントには機能名を表示
            "feature_name": feature_name,  # DB にも保存
            "action_detail": action_detail # 詳細も保存
        })
        db.commit()
    finally:
        db.close()