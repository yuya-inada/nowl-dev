# ファイル: fetch_boj.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import psycopg2
import os
from dotenv import load_dotenv
import pdfplumber
import re
import io

# .env読み込み
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
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/122.0.0.0 Safari/537.36"
}

def extract_text_from_pdf(pdf_url):
    """PDFリンクからテキストを抽出"""
    try:
        resp = requests.get(pdf_url)
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
        return text
    except Exception as e:
        print(f"PDF読み込み失敗: {pdf_url} / {e}")
        return ""

def extract_text_from_html(html_url):
    """HTMLリンクからテキスト抽出"""
    try:
        resp = requests.get(html_url)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        return soup.get_text(separator="\n", strip=True)
    except Exception as e:
        print(f"HTML読み込み失敗: {html_url} / {e}")
        return ""

def fetch_boj_minutes():
    """BOJ議事要旨ページからPDFリンクと開催日を取得"""
    resp = requests.get(BOJ_MINUTES_URL, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    events = []
    table_rows = soup.select("table tr")
    for tr in table_rows[1:]:
        tds = tr.find_all("td")
        if len(tds) < 2:
            continue
        posted_date_str = tds[0].get_text(strip=True)
        event_date_str = tds[1].get_text(strip=True)

        # PDF / HTMLリンク
        a_tag = tds[1].find("a", href=True)
        if not a_tag:
            month = re.search(r"(\d+)月", event_date_str)
            month_str = month.group(1) if month else "不明"
            print(f"{month_str}月分の議事要旨データはありませんでした")
            continue

        url = a_tag["href"]
        if not url.startswith("http"):
            url = BASE_URL + url

        # 日付変換（開催日最初の日）
        date_match = event_date_str.split("、")[0]
        if "日" not in date_match:
            date_match += "日"  # 「日」を補完
        event_date = datetime.strptime(f"{date_match} 2025", "%m月%d日 %Y").date()

        # DBに同じURLがあるか確認
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM economic_events WHERE statement_pdf_url = %s", (url,))
        if cur.fetchone():
            print(f"{event_date.month}月分の議事要旨は既に登録済みです")
            cur.close()
            conn.close()
            continue
        cur.close()
        conn.close()

        # PDFかHTMLかでテキスト抽出
        if url.lower().endswith(".pdf"):
            text_content = extract_text_from_pdf(url)
        else:
            text_content = extract_text_from_html(url)

        if not text_content:
            print(f"{event_date.month}月分の議事要旨テキストは取得できませんでした")

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

    if not events:
        print("BOJ議事要旨イベントはありませんでした")
    return events

def save_events_to_db(events):
    if not events:
        print("BOJ議事要旨イベントはありませんでした")
        return
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    for e in events:
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
    conn.commit()
    cur.close()
    conn.close()
    print(f"{len(events)} 件のBOJ議事要旨イベントを保存しました")

if __name__ == "__main__":
    events = fetch_boj_minutes()
    for e in events:
        print({
            "event_date": e["event_date"],
            "statement_pdf_url": e["statement_pdf_url"],
            "text_len": len(e["text_content"]) if e["text_content"] else 0
        })
    save_events_to_db(events)