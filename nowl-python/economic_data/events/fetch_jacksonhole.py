import requests
from bs4 import BeautifulSoup
import psycopg2
from datetime import datetime
import re
from dotenv import load_dotenv
import os

# .env 読み込み
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

BASE_URL = "https://www.kansascityfed.org"
SYMPOSIUM_URL = f"{BASE_URL}/research/jackson-hole-economic-symposium/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/122.0.0.0 Safari/537.36"
}

def fetch_jacksonhole_events():
    resp = requests.get(SYMPOSIUM_URL, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    events = []

    # ページ上にある年ごとのリンクを取得
    for a in soup.find_all("a", href=True):
        href = a["href"]
        text = a.get_text(strip=True)
        # 年が含まれているリンクを対象にする
        year_match = re.search(r"(20\d{2})", text)
        if year_match:
            year = int(year_match.group(1))
            url = href if href.startswith("http") else BASE_URL + href

            # Jackson Hole は毎年8月下旬なので、暫定的に 8月25日で保存
            event_date = datetime(year, 8, 25).date()

            events.append({
                "event_date": event_date,
                "country_code": "US",
                "event_name": "Jackson Hole",
                "statement_pdf_url": None,
                "press_conf_url": None,
                "minutes_pdf_url": None,
                "projection_pdf_url": None,
                "text_content": "",
                "description": f"Jackson Hole Symposium {year} ({url})"
            })

    return events

def save_events_to_db(events):
    if not events:
        print("Jackson Hole イベントは見つかりませんでした")
        return

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    for e in events:
        cur.execute("""
            INSERT INTO economic_events
            (event_date, country_code, event_name, statement_pdf_url,
             press_conf_url, minutes_pdf_url, projection_pdf_url,
             text_content, description)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (event_date, event_name) DO NOTHING
        """, (
            e["event_date"], e["country_code"], e["event_name"],
            e["statement_pdf_url"], e["press_conf_url"], e["minutes_pdf_url"], e["projection_pdf_url"],
            e["text_content"], e["description"]
        ))
    conn.commit()
    cur.close()
    conn.close()
    print(f"{len(events)} 件のJackson Holeイベントを保存しました")

if __name__ == "__main__":
    events = fetch_jacksonhole_events()
    save_events_to_db(events)