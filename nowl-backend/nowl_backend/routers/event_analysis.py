# 金融イベントの分析ロジック
from fastapi import APIRouter, HTTPException
from databases import Database
from datetime import datetime
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from sqlalchemy import text

# 環境変数ロード
load_dotenv("/Users/inadayuuya/nowl-dev/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

database = Database(DATABASE_URL)
router = APIRouter()


# ✅ lifespan イベントハンドラを定義
@asynccontextmanager
async def lifespan(app):
    await database.connect()
    yield
    await database.disconnect()


router.lifespan_context = lifespan


@router.post("/sync_events")
async def sync_event_master():
    """
    economic_calendar から主要イベント（FOMC, 日銀, CPI, 雇用統計 など）を
    event_analysis.event_master に同期登録する（UPSERT + 削除検知 + 履歴化）
    """

    try:
        # 1️⃣ 最新イベントを取得
        query = """
            SELECT id, indicator_name, country_code, importance,
                   COALESCE(event_date, event_datetime::date) AS event_date, category
            FROM public.economic_calendar
            WHERE indicator_name ILIKE ANY(ARRAY[
                '%FOMC%',
                '%日銀%',
                '%雇用統計%',
                '%CPI%',
                '%ECB%',
                '%金利%',
                '%GDP%'
            ]);
        """
        rows = await database.fetch_all(query=query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB SELECT エラー: {e}")

    if not rows:
        return {"message": "該当するイベントがありません。economic_calendarを確認してください。"}

    inserted_count = 0
    updated_count = 0
    deleted_count = 0

    # 2️⃣ 既存のevent_masterを全件取得
    existing_records = await database.fetch_all("SELECT date, event_name FROM event_analysis.event_master")
    existing_keys = {(r["date"], r["event_name"]) for r in existing_records}

    new_keys = set()
    for r in rows:
        econ_id = r["id"]
        name = r["indicator_name"]
        country = r["country_code"]
        importance = r["importance"]
        event_date = r["event_date"]
        category = r["category"]

        key = (event_date, name)
        new_keys.add(key)

        # 3️⃣ UPSERT（存在すればUPDATE、なければINSERT）
        upsert_query = """
            INSERT INTO event_analysis.event_master (
                date, country, event_category, event_name,
                impact_area, impact_level, content_prediction,
                result, expected_market_reaction, surprise_level, data_source,
                created_at, updated_at
            ) VALUES (
                :date, :country, :event_category, :event_name,
                :impact_area, :impact_level, :content_prediction,
                :result, :expected_market_reaction, :surprise_level, :data_source,
                NOW(), NOW()
            )
            ON CONFLICT (date, event_name)
            DO UPDATE SET
                country = EXCLUDED.country,
                event_category = EXCLUDED.event_category,
                impact_area = EXCLUDED.impact_area,
                impact_level = EXCLUDED.impact_level,
                updated_at = NOW();
        """
        try:
            result = await database.execute(query=upsert_query, values={
                "date": event_date,
                "country": country,
                "event_category": category or "Economic",
                "event_name": name,
                "impact_area": "Global",
                "impact_level": importance or "中",
                "content_prediction": None,
                "result": None,
                "expected_market_reaction": None,
                "surprise_level": None,
                "data_source": "economic_calendar",
            })

            if key not in existing_keys:
                inserted_count += 1
            else:
                updated_count += 1

        except Exception as e:
            print(f"UPSERTエラー（{name}）:", e)

    # 4️⃣ 削除されたイベントを履歴化
    to_delete = existing_keys - new_keys
    for date, name in to_delete:
        try:
            old_record = await database.fetch_one(
                "SELECT * FROM event_analysis.event_master WHERE date = :date AND event_name = :name",
                values={"date": date, "name": name},
            )
            if old_record:
                await database.execute(
                    """
                    INSERT INTO event_analysis.event_master_history
                    (event_id, date, country, event_name, data_source, snapshot)
                    VALUES (:event_id, :date, :country, :event_name, :data_source, :snapshot::jsonb)
                    """,
                    values={
                        "event_id": old_record["event_id"],
                        "date": old_record["date"],
                        "country": old_record["country"],
                        "event_name": old_record["event_name"],
                        "data_source": old_record["data_source"],
                        "snapshot": dict(old_record),
                    },
                )

            # 本体から削除
            await database.execute(
                "DELETE FROM event_analysis.event_master WHERE date = :date AND event_name = :name",
                values={"date": date, "name": name},
            )
            deleted_count += 1

        except Exception as e:
            print(f"削除・履歴化エラー（{name}）:", e)

    return {
        "message": f"イベント同期完了：追加 {inserted_count} 件 / 更新 {updated_count} 件 / 削除 {deleted_count} 件"
    }