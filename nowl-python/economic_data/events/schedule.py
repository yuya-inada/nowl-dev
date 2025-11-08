# /Users/inadayuuya/nowl-dev/nowl-python/economic_data/events/schedule.py
import sys
import os
import time
import subprocess
from datetime import datetime, timedelta
from pytz import timezone
import psycopg2
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv

sys.path.append(os.path.abspath("/Users/inadayuuya/nowl-dev/nowl-backend"))
from nowl_backend.utils.logs import log_event_sync

# --------------------------
# 環境変数読み込み
# --------------------------
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

FETCH_SCRIPT_PATH = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/events/fetch_economic_calendar.py"
JST = timezone("Asia/Tokyo")
scheduler = AsyncIOScheduler(timezone=JST)

# --------------------------
# ジョブ追加ユーティリティ
# --------------------------
def add_job_safe(func, trigger, job_id):
    if not any(job.id == job_id for job in scheduler.get_jobs()):
        scheduler.add_job(func, trigger=trigger, id=job_id)
        print(f"✅ ジョブ登録: {job_id}")
    else:
        print(f"⚠️ ジョブ {job_id} は既に存在するためスキップ")

# --------------------------
# データ取得処理
# --------------------------
def run_fetch_script():
    print("🚀 経済指標データ更新開始...")
    start_time = time.time()
    try:
        subprocess.run(["python3", FETCH_SCRIPT_PATH], check=True)
        duration = time.time() - start_time
        print("✅ 経済指標データ更新完了")
        log_event_sync(status="SUCCESS", added=0, updated=0, deleted=0, duration=duration)
    except subprocess.CalledProcessError as e:
        duration = time.time() - start_time
        print("❌ 経済指標更新エラー:", e)
        log_event_sync(status="FAILED", error=str(e), duration=duration)

# --------------------------
# イベントスケジュール
# --------------------------
def schedule_event_fetch(event_time, event_name):
    trigger_time = JST.localize(event_time) + timedelta(seconds=30) if event_time.tzinfo is None else event_time + timedelta(seconds=30)
    trigger = DateTrigger(run_date=trigger_time)
    add_job_safe(run_fetch_script, trigger, job_id=f"event_{event_name}_{event_time}")
    print(f"⏰ スケジュール登録: {event_name} → {trigger_time}")

def load_upcoming_events():
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT event_datetime, indicator_name
        FROM economic_calendar
        WHERE status = '未発表'
          AND event_datetime AT TIME ZONE 'Asia/Tokyo' > NOW() AT TIME ZONE 'Asia/Tokyo'
          AND event_datetime AT TIME ZONE 'Asia/Tokyo' < NOW() AT TIME ZONE 'Asia/Tokyo' + INTERVAL '12 hours'
    """)
    rows = cur.fetchall()
    conn.close()
    # Python側で naive datetime → JST aware に変換
    result = []
    for dt, name in rows:
        if dt.tzinfo is None:
            dt = JST.localize(dt)
        result.append((dt, name))
    return result

# --------------------------
# スケジューラ初期化
# --------------------------
def initialize_scheduler():
    print("🕒 経済指標スケジューラ初期化...")
    run_fetch_script()  # 即時更新

    now = datetime.now(JST)
    events = load_upcoming_events()
    for event_datetime, name in events:
        # 過去イベントは即時実行
        if event_datetime <= now:
            print(f"⏱ {name} は過去のイベントなので即時実行")
            run_fetch_script()
        else:
            schedule_event_fetch(event_datetime, name)

    # 3時間ごとの再スキャンジョブ
    interval_trigger = IntervalTrigger(hours=3)
    add_job_safe(initialize_scheduler, interval_trigger, job_id="recheck_events")

# --------------------------
# FastAPI 用スケジューラ起動
# --------------------------
def start_scheduler():
    if not scheduler.running:
        initialize_scheduler()
        scheduler.start()
        print("🛠 スケジューラ起動完了（FastAPI経由）")
    else:
        print("⚠️ スケジューラはすでに起動中")

# --------------------------
# 単体実行用
# --------------------------
if __name__ == "__main__":
    start_scheduler()
    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        print("🛑 スケジューラ停止")