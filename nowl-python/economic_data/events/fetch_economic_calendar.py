#!/usr/bin/env python3
# fetch_economic_calendar.py

from playwright.sync_api import sync_playwright
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
import psycopg2
import os
import re

# =========================
# ENV / DB
# =========================
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

URL = "https://jp.investing.com/economic-calendar/"

# =========================
# Utils
# =========================
def normalize_indicator(name: str):
    if not name:
        return None
    return re.sub(r"\s*\(.*?\)", "", name).strip()

def extract_text(el):
    if not el:
        return None
    txt = el.text_content()
    if not txt:
        return None
    txt = txt.strip()
    return None if txt in ("", "-", "—") else txt

def click_tab(page, label: str):
    page.locator("button", has_text=label).first.click()
    page.wait_for_timeout(2500)

def expand_all_rows(page):
    """「続きを表示」を全部押す"""
    while True:
        try:
            btn = page.locator("button", has_text="続きを表示")
            if btn.count() == 0 or not btn.first.is_visible():
                break
            btn.first.click()
            page.wait_for_timeout(1200)
        except:
            break

def scroll_page(page):
    """仮想DOM対策"""
    page.evaluate("""
        async () => {
            for (let i = 0; i < 12; i++) {
                window.scrollTo(0, document.body.scrollHeight);
                await new Promise(r => setTimeout(r, 400));
            }
        }
    """)

# =========================
# 🔥 核心：数値取得（PC / モバイル完全対応）
# =========================
def extract_values_from_row(row):
    actual = None
    forecast = None
    previous = None

    # 右寄せの数値セルをすべて取得
    value_tds = row.query_selector_all(
        "td.datatable-v2_cell--align-end__BtDxO, "
        "td[class*='align-end']"
    )

    values = []
    for td in value_tds:
        txt = extract_text(td)
        if txt:
            values.append(txt)

    # JP版 Investing の実態：
    # ・3つあれば → [結果, 予想, 前回]
    # ・2つなら   → [結果, 前回]
    # ・1つなら   → [結果]
    if len(values) >= 1:
        actual = values[0]
    if len(values) == 2:
        previous = values[1]
    if len(values) >= 3:
        forecast = values[1]
        previous = values[2]

    return actual, forecast, previous

# =========================
# Main Fetch
# =========================
def fetch_events(tab_label: str, base_date: date):
    events = []
    current_date = None

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(URL, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        if tab_label != "本日":
            click_tab(page, tab_label)

        expand_all_rows(page)
        scroll_page(page)

        rows = page.query_selector_all("tbody tr")
        print(f"[{tab_label}] 取得対象行数: {len(rows)}")

        for row in rows:
            try:
                # -----------------
                # 日付行
                # -----------------
                date_row = row.query_selector("td[colspan]")
                if date_row:
                    txt = date_row.inner_text().strip()
                    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", txt)
                    if m:
                        y, mth, d = map(int, m.groups())
                        current_date = date(y, mth, d)
                    continue

                if current_date is None:
                    continue

                # -----------------
                # 基本情報
                # -----------------
                time_el = row.query_selector("td.hidden.md\\:table-cell div")
                currency_el = row.query_selector(
                    "td.hidden.md\\:table-cell span.w-\\[30px\\]"
                )
                indicator_el = row.query_selector(
                    "a[href*='/economic-calendar/'] div"
                )

                time_text = extract_text(time_el)
                country = extract_text(currency_el)
                indicator = normalize_indicator(extract_text(indicator_el))

                if not time_text or not re.match(r"^\d{2}:\d{2}$", time_text):
                    continue
                if not country or not indicator:
                    continue

                actual, forecast, previous = extract_values_from_row(row)

                forecast = forecast if forecast is not None else "-"
                previous = previous if previous is not None else "-"

                stars = row.query_selector_all("svg use[href*='star-filled']")
                importance = {1: "LOW", 2: "MEDIUM", 3: "HIGH"}.get(len(stars))

                event_dt = datetime.combine(
                    current_date,
                    datetime.strptime(time_text, "%H:%M").time()
                )

                events.append({
                    "event_datetime": event_dt,
                    "event_date": current_date,
                    "country_code": country,
                    "indicator_name": indicator,
                    "actual_value": actual,
                    "forecast_value": forecast if forecast else "-",
                    "previous_value": previous if previous else "-",
                    "status": "結果あり" if actual else "未発表",
                    "importance": importance,
                    "category": None,
                })

            except Exception as e:
                print("行解析エラー:", e)

        print(f"[{tab_label}] events生成数: {len(events)}")
        browser.close()

    return events

# =========================
# Save DB
# =========================
def save_to_db(events):
    ins = upd = 0
    with psycopg2.connect(**DB_PARAMS) as conn:
        with conn.cursor() as cur:
            for e in events:
                cur.execute("""
                    INSERT INTO public.economic_calendar
                    (event_datetime, event_date, country_code, indicator_name,
                     actual_value, forecast_value, previous_value,
                     status, importance, category)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (country_code, indicator_name, event_datetime)
                    DO UPDATE SET
                        actual_value   = EXCLUDED.actual_value,
                        forecast_value = EXCLUDED.forecast_value,
                        previous_value = EXCLUDED.previous_value,
                        status         = EXCLUDED.status,
                        importance     = EXCLUDED.importance,
                        updated_at     = NOW()
                    RETURNING (xmax = 0);
                """, tuple(e.values()))

                if cur.fetchone()[0]:
                    ins += 1
                else:
                    upd += 1

    return ins, upd

# =========================
# Entry
# =========================
if __name__ == "__main__":
    today = date.today()
    jobs = [
        ("昨日", today - timedelta(days=1)),
        ("本日", today),
        ("今週", today),
        ("来週", today + timedelta(days=7)),
    ]

    for label, d in jobs:
        events = fetch_events(label, d)
        ins, upd = save_to_db(events)
        print(f"[{label}] 新規:{ins} 更新:{upd}")