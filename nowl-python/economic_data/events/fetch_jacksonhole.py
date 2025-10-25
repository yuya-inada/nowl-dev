# ファイル: fetch_jacksonhole_rss.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import psycopg2
import os
from dotenv import load_dotenv

# .env 読み込み
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

RSS_URL = "https://www.federalreserve.gov/feeds/press_releases.xml"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/122.0.0.0 Safari/537.36"
}


def fetch_jacksonhole_events():
    print("Fetching Jackson Hole RSS feed...")
    resp = requests.get(RSS_URL, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "xml")
    events = []

    for item in soup.find_all("item"):
        title = item.title.string
        link = item.link.string
        pub_date = item.pubDate.string

        # Jackson Hole に関する記事のみ
        if "Jackson Hole" not in title:
            continue

        try:
            event_date = datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S %Z").date()
        except Exception:
            event_date = datetime.today().date()

        # PDFリンクはHTMLページの中から探す
        statement_pdf_url = None
        if link.lower().endswith(".pdf"):
            statement_pdf_url = link
        else:
            # HTMLならPDFリンクを探す
            try:
                page_resp = requests.get(link, headers=HEADERS, timeout=10)
                page_resp.raise_for_status()
                page_soup = BeautifulSoup(page_resp.text, "html.parser")
                a_tags = page_soup.find_all("a", href=True)
                for a in a_tags:
                    href = a["href"]
                    if href.lower().endswith(".pdf"):
                        statement_pdf_url = href if href.startswith("http") else "https://www.federalreserve.gov" + href
                        break
            except Exception as e:
                print(f"Error fetching PDF from {link}: {e}")

        events.append({
            "event_date": event_date,
            "country_code": "US",
            "event_name": "Jackson Hole",
            "statement_pdf_url": statement_pdf_url,
            "press_conf_url": None,
            "minutes_pdf_url": None,
            "projection_pdf_url": None,
            "text_content": "",
            "description": f"{title} ({link})"
        })

    print(f"Found {len(events)} Jackson Hole events")
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
            e["statement_pdf_url"], e["press_conf_url"], e["minutes_pdf_url"],
            e["projection_pdf_url"], e["text_content"], e["description"]
        ))
    conn.commit()
    cur.close()
    conn.close()
    print(f"{len(events)} 件のJackson Holeイベントを保存しました")


if __name__ == "__main__":
    events = fetch_jacksonhole_events()
    for e in events:
        print(e)
    save_events_to_db(events)