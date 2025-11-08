# fetch_fomc_with_log.py
import requests
from bs4 import BeautifulSoup
import psycopg2
from datetime import datetime
import re
import pdfplumber
from io import BytesIO
from dotenv import load_dotenv
import os

load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

FRB_FOMC_URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}

# ----------------------
# ログ記録関数
# ----------------------
def log_event(cur, event_name, event_date=None, status="INFO", note=None):
    log_time = datetime.now()
    if event_date is None:
        event_date = log_time.date()
    try:
        cur.execute("""
            INSERT INTO economic_event_logs(
                event_name, event_datetime, status, error_message, log_time
            ) VALUES (%s, %s, %s, %s, %s)
        """, (event_name, event_date, status, note, log_time))
    except Exception as ex:
        print(f"ログ記録失敗: {ex}")

# ----------------------
# PDF取得・テキスト抽出関数
# ----------------------
def extract_text_from_pdf(cur, pdf_url, event_date):
    """PDFからテキストを抽出し、ログに記録"""
    text_content = ""
    try:
        r = requests.get(pdf_url, headers=HEADERS)
        r.raise_for_status()
        with pdfplumber.open(BytesIO(r.content)) as pdf:
            for page in pdf.pages:
                text_content += (page.extract_text() or "") + "\n"
        log_event(cur, "FOMC", event_date, "SUCCESS", pdf_url)
    except Exception as ex:
        log_event(cur, "FOMC", event_date, "FAILURE", f"{pdf_url} / {ex}")
        print(f"Statement PDF取得失敗: {pdf_url} / {ex}")
    return text_content

# ----------------------
# FOMCスケジュール取得
# ----------------------
def fetch_fomc_schedule():
    resp = requests.get(FRB_FOMC_URL, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    events = []

    panels = soup.find_all("div", class_="panel panel-default")
    for panel in panels:
        year_tag = panel.find("a")
        if not year_tag:
            continue
        year_text = year_tag.text.strip()
        year_match = re.match(r"(\d{4}) FOMC Meetings", year_text)
        if not year_match:
            continue
        year = int(year_match.group(1))

        for meeting_div in panel.find_all("div", class_=re.compile("fomc-meeting")):
            month_tag = meeting_div.find("div", class_="fomc-meeting__month")
            if not month_tag or not month_tag.strong:
                continue
            month_name = month_tag.strong.text.strip().split("/")[0]

            try:
                month_num = datetime.strptime(month_name, "%B").month
            except ValueError:
                continue

            day_tag = meeting_div.find("div", class_="fomc-meeting__date")
            if not day_tag:
                continue
            day_text = day_tag.text.strip()
            try:
                start_day = int(re.match(r"(\d{1,2})", day_text).group(1))
            except:
                continue

            event_date = datetime(year, month_num, start_day).date()

            # リンク取得
            statement_pdf_url = None
            press_conf_url = None
            minutes_pdf_url = None
            projection_pdf_url = None
            text_content = ""

            for a in meeting_div.find_all("a", href=True):
                href = a['href']
                href_full = f"https://www.federalreserve.gov{href}" if href.startswith("/") else href
                if re.search(r"/monetary\d{8}a\d\.pdf$", href):
                    statement_pdf_url = href_full
                elif re.search(r"/fomcpresconf\d{8}\.htm$", href):
                    press_conf_url = href_full
                elif re.search(r"/fomcminutes\d{8}\.pdf$", href):
                    minutes_pdf_url = href_full
                elif re.search(r"/fomcprojtabl\d{8}\.pdf$", href):
                    projection_pdf_url = href_full

            # Statement PDFからテキスト抽出
            if statement_pdf_url:
                text_content = extract_text_from_pdf(cur, statement_pdf_url, event_date)

            description = "; ".join(filter(None, [
                "Statement" if statement_pdf_url else None,
                "Press Conference" if press_conf_url else None,
                "Minutes" if minutes_pdf_url else None,
                "Projection Materials" if projection_pdf_url else None
            ]))

            events.append({
                "event_date": event_date,
                "country_code": "US",
                "event_name": "FOMC",
                "statement_pdf_url": statement_pdf_url,
                "press_conf_url": press_conf_url,
                "minutes_pdf_url": minutes_pdf_url,
                "projection_pdf_url": projection_pdf_url,
                "text_content": text_content,
                "description": description
            })

    return events

# ----------------------
# DB保存
# ----------------------
def save_events_to_db(events):
    if not events:
        print("FOMCイベントは見つかりませんでした")
        return

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    for e in events:
        cur.execute("""
            SELECT id, text_extracted FROM economic_events
            WHERE event_name=%s AND event_date=%s
        """, ("FOMC", e["event_date"]))
        row = cur.fetchone()

        if row is None:
            cur.execute("""
                INSERT INTO economic_events 
                (event_date, country_code, event_name, statement_pdf_url, press_conf_url,
                 minutes_pdf_url, projection_pdf_url, text_content, description, text_extracted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                e["event_date"], e["country_code"], e["event_name"],
                e["statement_pdf_url"], e["press_conf_url"], e["minutes_pdf_url"], e["projection_pdf_url"],
                e["text_content"], e["description"], True if e["text_content"] else False
            ))
        else:
            text_content = e["text_content"] if not row[1] else None
            cur.execute("""
                UPDATE economic_events
                SET statement_pdf_url=%s, press_conf_url=%s, minutes_pdf_url=%s, 
                    projection_pdf_url=%s, text_content=COALESCE(%s,text_content),
                    description=%s, text_extracted=COALESCE(%s,text_extracted)
                WHERE id=%s
            """, (
                e["statement_pdf_url"], e["press_conf_url"], e["minutes_pdf_url"], e["projection_pdf_url"],
                text_content, e["description"], True if text_content else row[1], row[0]
            ))
    conn.commit()
    cur.close()
    conn.close()
    print(f"{len(events)} 件のFOMCイベントを保存しました")

# ----------------------
# メイン処理
# ----------------------
if __name__ == "__main__":
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    print("FOMCスケジュール取得開始")
    log_event(cur, "FOMC", None, "START", "FOMCスケジュール取得開始")

    fomc_events = fetch_fomc_schedule()
    print(f"{len(fomc_events)} 件のFOMCイベントを取得しました")
    log_event(cur, "FOMC", None, "INFO", f"{len(fomc_events)} 件のFOMCイベントを取得")

    print("FOMCイベントをDBに保存開始")
    log_event(cur, "FOMC", None, "START_DB_SAVE", "DB保存開始")

    save_events_to_db(fomc_events)

    print("FOMCイベント保存完了")
    log_event(cur, "FOMC", None, "COMPLETE", "DB保存完了")

    conn.commit()
    cur.close()
    conn.close()