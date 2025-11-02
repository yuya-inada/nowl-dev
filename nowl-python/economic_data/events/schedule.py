# /Users/inadayuuya/nowl-dev/nowl-python/economic_data/events/schedule.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
import subprocess
import psycopg2
import os
from dotenv import load_dotenv

# ✅ .env 読み込み
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

FETCH_SCRIPT_PATH = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/events/fetch_economic_calendar.py"

scheduler = BackgroundScheduler()

# =============================
# 定期処理・スケジューリング処理
# =============================

def run_fetch_script():
    """経済指標データを取得・更新"""
    print("🚀 経済指標データ更新開始...")
    try:
        subprocess.run(["python3", FETCH_SCRIPT_PATH])
        print("✅ 経済指標データ更新完了")
    except Exception as e:
        print("❌ 経済指標更新エラー:", e)

def schedule_event_fetch(event_time, event_name):
    """各イベントの発表30秒後に再取得ジョブを登録"""
    trigger_time = event_time + timedelta(seconds=30)
    trigger = DateTrigger(run_date=trigger_time)
    scheduler.add_job(run_fetch_script, trigger=trigger, id=f"event_{event_name}_{event_time}")
    print(f"⏰ スケジュール登録: {event_name} → {trigger_time}")

def load_upcoming_events():
    """今後12時間以内の未発表イベントを取得"""
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT event_datetime, indicator_name
        FROM economic_calendar
        WHERE status = '未発表'
          AND event_datetime > NOW()
          AND event_datetime < NOW() + INTERVAL '12 hours'
    """)
    rows = cur.fetchall()
    conn.close()
    return rows

def initialize_scheduler():
    """スケジューラ初期化処理"""
    print("🕒 経済指標スケジューラ初期化...")
    run_fetch_script()

    events = load_upcoming_events()
    for event_datetime, name in events:
        schedule_event_fetch(event_datetime, name)

    # 3時間ごとに再スキャン
    scheduler.add_job(initialize_scheduler, 'interval', hours=3, id="recheck_events")

    scheduler.start()
    print("✅ スケジューラ起動完了。バックグラウンド常駐中。")