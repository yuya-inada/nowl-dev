#!/usr/bin/env python3
# fetch_economic_calendar_today_with_status_and_importance.py
from playwright.sync_api import sync_playwright
from datetime import datetime, date
from dotenv import load_dotenv
import os
import psycopg2

# --------------------------
# .env読み込みとDB接続情報
# --------------------------
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

ECONOMIC_CALENDAR_URL = "https://www.investing.com/economic-calendar/"

def _clean(val):
    if val is None:
        return None
    v = val.strip()
    if v in ("", "—", "-", "N/A", "–"):
        return None
    return v

def fetch_economic_calendar_today():
    events = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--window-size=1920,1080"])
        page = browser.new_page()
        page.set_extra_http_headers({"Accept-Language": "en-US,en;q=0.9"})
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        page.goto(ECONOMIC_CALENDAR_URL, timeout=180000)

        # Todayタブをクリック
        today_tab = page.query_selector("a#timeFrame_today")
        if today_tab:
            today_tab.click()
            page.wait_for_timeout(3000)  # JS描画待機

        rows = page.query_selector_all("tr.js-event-item")
        for row in rows:
            try:
                country = _clean(row.query_selector("td.flagCur").inner_text()) if row.query_selector("td.flagCur") else None
                indicator = _clean(row.query_selector("td.event").inner_text()) if row.query_selector("td.event") else None
                actual = _clean(row.query_selector("td.act").inner_text()) if row.query_selector("td.act") else None
                forecast = _clean(row.query_selector("td.fore").inner_text()) if row.query_selector("td.fore") else None
                previous = _clean(row.query_selector("td.prev").inner_text()) if row.query_selector("td.prev") else None

                # datetime
                dt_attr = row.get_attribute("data-event-datetime")
                if dt_attr:
                    dt = datetime.strptime(dt_attr, "%Y/%m/%d %H:%M:%S")
                else:
                    time_text = row.query_selector("td.time").inner_text().strip() if row.query_selector("td.time") else "00:00"
                    t = datetime.strptime(time_text, "%H:%M").time()
                    dt = datetime.combine(date.today(), t)

                # status
                status = "結果あり" if actual else "未発表"

                # importance
                importance_cell = row.query_selector("td.sentiment")
                if importance_cell:
                    img_key = importance_cell.get_attribute("data-img_key")  # bull1 / bull2 / bull3
                    importance = {"bull1": "LOW", "bull2": "MEDIUM", "bull3": "HIGH"}.get(img_key, None)
                else:
                    importance = None

                events.append({
                    "event_datetime": dt,
                    "country_code": country,
                    "indicator_name": indicator,
                    "actual_value": actual,
                    "forecast_value": forecast,
                    "previous_value": previous,
                    "status": status,
                    "importance": importance
                })
            except Exception as e:
                print("行解析エラー:", e)
                continue

        browser.close()
    return events

def save_calendar_to_db(events):
    if not events:
        print("保存対象データなし")
        return

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    inserted = 0
    for e in events:
        try:
            cur.execute("""
                INSERT INTO economic_calendar
                (event_datetime, country_code, indicator_name,
                 actual_value, forecast_value, previous_value,
                 status, importance, last_updated)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                ON CONFLICT (event_datetime, indicator_name)
                DO UPDATE SET
                  actual_value = COALESCE(NULLIF(EXCLUDED.actual_value, ''), economic_calendar.actual_value),
                  forecast_value = COALESCE(NULLIF(EXCLUDED.forecast_value, ''), economic_calendar.forecast_value),
                  previous_value = COALESCE(NULLIF(EXCLUDED.previous_value, ''), economic_calendar.previous_value),
                  status = CASE
                              WHEN COALESCE(NULLIF(EXCLUDED.actual_value, ''), economic_calendar.actual_value) IS NOT NULL THEN '結果あり'
                              ELSE '未発表'
                           END,
                  importance = EXCLUDED.importance,
                  last_updated = NOW()
            """, (
                e["event_datetime"], e["country_code"], e["indicator_name"],
                e["actual_value"], e["forecast_value"], e["previous_value"],
                e["status"], e["importance"]
            ))
            inserted += 1
        except Exception as ex:
            print("DB挿入エラー:", ex)
            print("対象データ:", e)

    conn.commit()
    cur.close()
    conn.close()
    print(f"{inserted} 件の経済カレンダーを保存しました")

if __name__ == "__main__":
    events = fetch_economic_calendar_today()
    print(f"総件数: {len(events)}")
    for e in events[:50]:
        print(e)
    save_calendar_to_db(events)