# routers/economic_events.py
from fastapi import APIRouter, HTTPException
from typing import List
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

router = APIRouter()

@router.get("/api/economic-events", summary="経済イベント一覧 / Economic Events List")
def get_economic_events():
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        cur.execute("""
            SELECT event_date, event_name, country_code
            FROM economic_events
            ORDER BY event_date DESC
            LIMIT 50
        """)
        rows = cur.fetchall()
        events = [{"event_date": str(r[0]), "event_name": r[1], "country_code": r[2]} for r in rows]
        cur.close()
        conn.close()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))