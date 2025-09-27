# fetch_fomc.py
import requests
from bs4 import BeautifulSoup
import psycopg2
from datetime import datetime
import re
import pdfplumber
from io import BytesIO

DB_PARAMS = {
    "host": "localhost",
    "port": 5432,
    "dbname": "nowldb",
    "user": "inadayuuya",
    "password": "postgres",
}

FRB_FOMC_URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}

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

            # 各リンクを取得
            statement_pdf_url = None
            press_conf_url = None
            minutes_pdf_url = None
            projection_pdf_url = None
            text_content = ""

            for a in meeting_div.find_all("a", href=True):
              href = a['href']
              href_full = f"https://www.federalreserve.gov{href}" if href.startswith("/") else href
              # PDF判定は href のパターンで行う
              if re.search(r"/monetary\d{8}a\d\.pdf$", href):
                  statement_pdf_url = href_full
              elif re.search(r"/fomcpresconf\d{8}\.htm$", href):
                  press_conf_url = href_full
              elif re.search(r"/fomcminutes\d{8}\.pdf$", href):
                  minutes_pdf_url = href_full
              elif re.search(r"/fomcprojtabl\d{8}\.pdf$", href):
                  projection_pdf_url = href_full

            # Statement PDFのテキストを取得
            if statement_pdf_url:
                try:
                    r = requests.get(statement_pdf_url, headers=HEADERS)
                    with pdfplumber.open(BytesIO(r.content)) as pdf:
                        for page in pdf.pages:
                            text_content += page.extract_text() + "\n"
                except Exception as ex:
                    print(f"Statement PDF取得失敗: {statement_pdf_url} / {ex}")

            # description列を作成
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

def save_events_to_db(events):
    if not events:
        print("FOMCイベントは見つかりませんでした")
        return

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    for e in events:
      # 既存イベント確認
      cur.execute("""
          SELECT id, text_extracted FROM economic_events
          WHERE event_name=%s AND event_date=%s
      """, ("FOMC", e["event_date"]))
      row = cur.fetchone()

      if row is None:
          # 新規挿入 → text_content も取得
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
          # 既存行更新 → text_content は既に抽出済みなら更新しない
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

if __name__ == "__main__":
    fomc_events = fetch_fomc_schedule()
    save_events_to_db(fomc_events)