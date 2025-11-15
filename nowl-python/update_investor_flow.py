# update_investor_flow.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import camelot
import pandas as pd
import re
import asyncio
from databases import Database
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

# -------------------------
# .envロード & DB初期化
# -------------------------
load_dotenv("/Users/inadayuuya/nowl-dev/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file")
database = Database(DATABASE_URL)

# -------------------------
# ヘルパー関数
# -------------------------
def normalize_href(href: str) -> str:
    if href.startswith("chrome-extension://"):
        i = href.find("http")
        if i >= 0:
            return href[i:]
    return href

def extract_date_from_filename(url):
    match = re.search(r"(\d{6})\.pdf", url)
    return match.group(1) if match else None

def parse_weekly_code(code: str) -> datetime.date:
    """
    例: 250902 -> 2025年9月第2週
    月曜始まり、週番号を月内の第N週として計算
    """
    yy = int(code[:2])
    mm = int(code[2:4])
    week_no = int(code[4:])
    year = 2000 + yy
    first_day = datetime(year, mm, 1)
    first_monday = first_day + timedelta(days=(7 - first_day.weekday()) % 7)
    target_date = first_monday + timedelta(days=(week_no - 1) * 7)
    return target_date.date()

async def save_log_to_db(status, pdf_url=None, pdf_date=None, table_count=None, record_count=None, message=None):
    log_query = """
    INSERT INTO investor_flow_log (pdf_date, status, pdf_url, table_count, record_count, message)
    VALUES (:pdf_date, :status, :pdf_url, :table_count, :record_count, :message)
    ON CONFLICT (pdf_date)
    DO UPDATE SET
        status = EXCLUDED.status,
        table_count = EXCLUDED.table_count,
        record_count = EXCLUDED.record_count,
        message = EXCLUDED.message,
        run_at = NOW();
    """
    values = {
        "status": status,
        "pdf_url": pdf_url,
        "pdf_date": pdf_date,
        "table_count": table_count,
        "record_count": record_count,
        "message": message,
    }
    await database.execute(log_query, values)

# -------------------------
# メイン処理
# -------------------------
async def main():
    await database.connect()
    try:
        # --- JPX PDF取得 ---
        JPX_URL = "https://www.jpx.co.jp/markets/statistics-equities/investor-type/index.html"
        resp = requests.get(JPX_URL)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        pdf_links = [
            urljoin(JPX_URL, normalize_href(a["href"]))
            for a in soup.find_all("a", href=True)
            if a["href"].lower().endswith(".pdf")
        ]

        pdf_with_dates = [(url, extract_date_from_filename(url)) for url in pdf_links]
        pdf_with_dates = [(url, d) for url, d in pdf_with_dates if d]

        if not pdf_with_dates:
            raise ValueError("PDFリンクが見つかりませんでした")

        latest_pdf_url = max(pdf_with_dates, key=lambda x: x[1])[0]
        print("Latest PDF URL:", latest_pdf_url)

        # PDFダウンロード
        pdf_filename = "latest_investor_flow.pdf"
        pdf_data = requests.get(latest_pdf_url)
        with open(pdf_filename, "wb") as f:
            f.write(pdf_data.content)
        print("PDF downloaded:", pdf_filename)

        # --- CamelotでPDF解析 ---
        tables = camelot.read_pdf(pdf_filename, pages="all")
        print(f"抽出した表の数: {len(tables)}")

        # 抽出対象主体
        target_investors = {
            "Proprietary": ["自己計", "Proprietary"],
            "Brokerage": ["委託計", "Brokerage"],
            "Individuals": ["個人", "Individuals"],
            "Foreigners": ["海外投資家", "Foreigners"],
            "Securities Cos.": ["証券会社", "Securities Cos."],
            "Institutions": ["法人", "Institutions"],
            "Financials": ["金融機関", "Financials"]
        }

        records = []

        # --- 全テーブル走査 ---
        for t in tables:
            df = t.df.copy()
            df.columns = [f"col{i}" for i in range(len(df.columns))]

            for _, row in df.iterrows():
                col0 = str(row["col0"]).strip()
                for key, keywords in target_investors.items():
                    if any(k in col0 for k in keywords):
                        market_2, real_deli = 0, 0
                        for col in ["col3", "col6", "col1", "col2", "col4", "col5"]:
                            if col in df.columns:
                                try:
                                    val = int(str(row[col]).replace(",", "").replace("−", "-"))
                                    if market_2 == 0:
                                        market_2 = val
                                    else:
                                        real_deli = val
                                except:
                                    continue
                        records.append({
                            "investor_type": key,
                            "market_2": market_2,
                            "real_deli": real_deli
                        })

        investor_df = pd.DataFrame(records)
        investor_df = investor_df.groupby("investor_type", as_index=False).sum()
        print(investor_df)

        # --- DB Upsert ---
        query = """
        INSERT INTO investor_flow (date, investor_type, market_2, real_deli)
        VALUES (:date, :investor_type, :market_2, :real_deli)
        ON CONFLICT (date, investor_type) DO UPDATE
        SET market_2 = EXCLUDED.market_2,
            real_deli = EXCLUDED.real_deli,
            updated_at = NOW()
        """
        pdf_date_str = extract_date_from_filename(latest_pdf_url)
        pdf_date = parse_weekly_code(pdf_date_str)

        for _, row in investor_df.iterrows():
            values = {
                "date": pdf_date,
                "investor_type": row["investor_type"],
                "market_2": row["market_2"],
                "real_deli": row["real_deli"]
            }
            await database.execute(query=query, values=values)

        print(f"Investor flow data updated for week starting {pdf_date}!")

        # --- ログ保存 ---
        await save_log_to_db(
            status="success",
            pdf_url=latest_pdf_url,
            pdf_date=pdf_date,
            table_count=len(tables),
            record_count=len(investor_df),
            message="OK"
        )
        print("Log written to investor_flow_log")

    except Exception as e:
        # --- 失敗ログ ---
        await save_log_to_db(
            status="failed",
            pdf_url=latest_pdf_url if 'latest_pdf_url' in locals() else None,
            message=str(e)
        )
        raise
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(main())