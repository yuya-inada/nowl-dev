# /Users/inadayuuya/nowl-dev/nowl-python/economic_data/events/schedule.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import time, timedelta
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
# ジョブ追加用ユーティリティ
# =============================
def add_job_safe(func, trigger, job_id):
    """同じIDのジョブが存在しなければ追加"""
    if not any(job.id == job_id for job in scheduler.get_jobs()):
        scheduler.add_job(func, trigger=trigger, id=job_id)
        print(f"✅ ジョブ登録: {job_id}")
    else:
        print(f"⚠️ ジョブ {job_id} は既に存在するためスキップ")

# =============================
# 定期処理・スケジューリング処理
# =============================
def run_fetch_script():
    """経済指標データを取得・更新"""
    print("🚀 経済指標データ更新開始...")
    try:
        subprocess.run(["python3", FETCH_SCRIPT_PATH], check=True)
        print("✅ 経済指標データ更新完了")
    except subprocess.CalledProcessError as e:
        print("❌ 経済指標更新エラー:", e)

def schedule_event_fetch(event_time, event_name):
    """各イベントの発表30秒後に再取得ジョブを登録"""
    trigger_time = event_time + timedelta(seconds=30)
    trigger = DateTrigger(run_date=trigger_time)
    add_job_safe(run_fetch_script, trigger, job_id=f"event_{event_name}_{event_time}")
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

    # 今後のイベントをスケジュール
    events = load_upcoming_events()
    for event_datetime, name in events:
        schedule_event_fetch(event_datetime, name)

    # 3時間ごとの再スキャンジョブを登録（重複チェック）
    interval_trigger = IntervalTrigger(hours=3)
    add_job_safe(initialize_scheduler, interval_trigger, job_id="recheck_events")
    


# =============================
# スクリプト単体実行時
# =============================
if __name__ == "__main__":
    # 初期化＆スケジューラ登録
    initialize_scheduler()

    # スケジューラ開始
    scheduler.start()
    print("🛠 スケジューラ起動完了")

    # プロセスを止めないために無限ループ
    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        print("🛑 スケジューラ停止")