# save_to_db.py
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

DB_PARAMS = {
    "host": "localhost",
    "port": 5432,
    "dbname": "nowldb",
    "user": "inadayuuya",
    "password": "",
}

def save_indicator_to_db(date, country_code, country_name, indicator_name, actual_value,
                         forecast_value=None, previous_value=None, importance=3, unit=""):
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO economic_indicators 
            (date, country_code, country_name, indicator_name, actual_value,
             forecast_value, previous_value, importance, unit, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now())
            ON CONFLICT ON CONSTRAINT unique_indicator_per_day DO UPDATE
            SET actual_value = EXCLUDED.actual_value,
                forecast_value = EXCLUDED.forecast_value,
                previous_value = EXCLUDED.previous_value,
                importance = EXCLUDED.importance,
                unit = EXCLUDED.unit,
                updated_at = now()
        """, (date, country_code, country_name, indicator_name, actual_value,
              forecast_value, previous_value, importance, unit))
        conn.commit()
    except Exception as e:
        print(f"DB保存エラー: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()