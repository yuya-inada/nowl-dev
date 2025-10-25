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
            SELECT id, event_date, event_name, country_code, description,
                   created_at, statement_pdf_url, press_conf_url, 
                   minutes_pdf_url, projection_pdf_url, text_content, text_extracted
            FROM economic_events
            ORDER BY event_date DESC
            LIMIT 50
        """)
        rows = cur.fetchall()
        events = []
        for r in rows:
            events.append({
                "id": r[0],
                "event_date": str(r[1]),
                "event_name": r[2],
                "country_code": r[3],
                "description": r[4],
                "created_at": str(r[5]) if r[5] else None,
                "statement_pdf_url": r[6],
                "press_conf_url": r[7],
                "minutes_pdf_url": r[8],
                "projection_pdf_url": r[9],
                "text_content": r[10],
                "text_extracted": r[11],
            })
        cur.close()
        conn.close()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))