# fetch_boj_with_log_shared_conn.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import psycopg2
import os
from dotenv import load_dotenv
import pdfplumber
import re
import io

load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

BASE_URL = "https://www.boj.or.jp"
BOJ_MINUTES_URL = f"{BASE_URL}/mopo/mpmsche_minu/minu_2025/index.htm"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def log_event(cur, event_name, event_date, status, error_message=None):
    """経済イベントログに記録"""
    log_time = datetime.now()
    cur.execute("""
        INSERT INTO economic_event_logs(
            event_name, event_datetime, status, error_message, log_time
        )
        VALUES (%s, %s, %s, %s, %s)
    """, (event_name, event_date, status, error_message, log_time))

def extract_text_from_pdf(pdf_url, event_date, cur):
    try:
        resp = requests.get(pdf_url)
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        log_event(cur, "BOJ Minutes", event_date, "SUCCESS", pdf_url)
        return text
    except Exception as e:
        log_event(cur, "BOJ Minutes", event_date, "FAILURE", f"{pdf_url} / {e}")
        print(f"PDF読み込み失敗: {pdf_url} / {e}")
        return ""

def extract_text_from_html(html_url, event_date, cur):
    try:
        resp = requests.get(html_url)
        resp.raise_for_status()
        text = BeautifulSoup(resp.text, "html.parser").get_text(separator="\n", strip=True)
        log_event(cur, "BOJ Minutes", event_date, "SUCCESS", html_url)
        return text
    except Exception as e:
        log_event(cur, "BOJ Minutes", event_date, "FAILURE", f"{html_url} / {e}")
        print(f"HTML読み込み失敗: {html_url} / {e}")
        return ""

def fetch_boj_minutes(cur):
    resp = requests.get(BOJ_MINUTES_URL, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    events = []
    table_rows = soup.select("table tr")[1:]

    for tr in table_rows:
        tds = tr.find_all("td")
        if len(tds) < 2:
            continue
        posted_date_str = tds[0].get_text(strip=True)
        event_date_str = tds[1].get_text(strip=True)

        a_tag = tds[1].find("a", href=True)
        if not a_tag:
            month = re.search(r"(\d+)月", event_date_str)
            print(f"{month.group(1) if month else '不明'}月分の議事要旨データはありませんでした")
            continue

        url = a_tag["href"]
        if not url.startswith("http"):
            url = BASE_URL + url

        # 日付変換
        date_match = event_date_str.split("、")[0]
        if "日" not in date_match:
            date_match += "日"
        try:
            event_date = datetime.strptime(f"{date_match} 2025", "%m月%d日 %Y").date()
        except:
            print(f"日付変換失敗: {event_date_str}")
            log_event(cur, "BOJ Minutes", None, "FAILURE", f"日付変換失敗: {event_date_str}")
            continue

        # 既存チェック
        cur.execute("SELECT 1 FROM economic_events WHERE statement_pdf_url=%s", (url,))
        if cur.fetchone():
            log_event(cur, "BOJ Minutes", event_date, "PENDING", "既にDBに登録済み")
            print(f"{event_date_str} は既に登録済み")
            continue

        text_content = extract_text_from_pdf(url, event_date, cur) if url.lower().endswith(".pdf") else extract_text_from_html(url, event_date, cur)
        if not text_content:
            print(f"{event_date.month}月分の議事要旨テキスト取得失敗: {url}")

        events.append({
            "event_date": event_date,
            "country_code": "JP",
            "event_name": "BOJ Minutes",
            "description": f"日銀金融政策決定会合議事要旨 {posted_date_str}",
            "statement_pdf_url": url,
            "press_conf_url": None,
            "minutes_pdf_url": None,
            "projection_pdf_url": None,
            "text_content": text_content
        })

    return events

def save_events_to_db(events, cur):
    if not events:
        print("BOJ議事要旨イベントはありませんでした")
        return
    for e in events:
        try:
            cur.execute("""
                INSERT INTO economic_events
                (event_date, country_code, event_name, description,
                 statement_pdf_url, press_conf_url, minutes_pdf_url, projection_pdf_url,
                 text_content)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (event_date, event_name) DO NOTHING
            """, (
                e["event_date"], e["country_code"], e["event_name"], e["description"],
                e["statement_pdf_url"], e["press_conf_url"], e["minutes_pdf_url"],
                e["projection_pdf_url"], e["text_content"]
            ))
        except Exception as ex:
            log_event(cur, "BOJ Minutes", e["event_date"], "FAILURE", str(ex))
            print(f"DB保存失敗: {e['statement_pdf_url']} / {ex}")
    print(f"{len(events)} 件のBOJ議事要旨イベントを保存しました")

if __name__ == "__main__":
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    try:
        events = fetch_boj_minutes(cur)
        for e in events:
            print({
                "event_date": e["event_date"],
                "statement_pdf_url": e["statement_pdf_url"],
                "text_len": len(e["text_content"]) if e["text_content"] else 0
            })
        save_events_to_db(events, cur)
        conn.commit()  # まとめてコミット
    finally:
        cur.close()
        conn.close()