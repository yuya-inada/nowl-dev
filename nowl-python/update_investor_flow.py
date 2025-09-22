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
load_dotenv("/Users/inadayuuya/nowl-dev/.env")

# --- DB設定 ---
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://nowluser:nowlowlione@localhost:5432/nowldb"
)
database = Database(DATABASE_URL)

# --- JPX PDF取得 ---
JPX_URL = "https://www.jpx.co.jp/markets/statistics-equities/investor-type/index.html"
response = requests.get(JPX_URL)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

pdf_links = [
    urljoin(JPX_URL, a["href"])
    for a in soup.find_all("a", href=True)
    if a["href"].lower().endswith(".pdf")
]

# PDFリンクから日付抽出
def extract_date_from_filename(url):
    match = re.search(r"(\d{6})\.pdf", url)
    return match.group(1) if match else None

pdf_with_dates = [(url, extract_date_from_filename(url)) for url in pdf_links]
pdf_with_dates = [(url, d) for url, d in pdf_with_dates if d]

latest_pdf_url = max(pdf_with_dates, key=lambda x: x[1])[0] if pdf_with_dates else None
print("Latest PDF URL:", latest_pdf_url)

# PDFダウンロード
pdf_filename = "latest_investor_flow.pdf"
if latest_pdf_url:
    pdf_data = requests.get(latest_pdf_url)
    with open(pdf_filename, "wb") as f:
        f.write(pdf_data.content)
    print("PDF downloaded:", pdf_filename)
else:
    raise ValueError("PDFリンクが見つかりませんでした")

# --- CamelotでPDF読み取り ---
tables = camelot.read_pdf(pdf_filename, pages="all")
print(f"抽出した表の数: {len(tables)}")

# 抽出対象の主体
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
                # 売り・買い列を探して数値抽出
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

# 同一主体が複数行に分かれている場合は合計
investor_df = investor_df.groupby("investor_type", as_index=False).sum()

print(investor_df)

# --- DBにUpsert ---
async def main():
    await database.connect()
    query = """
    INSERT INTO investor_flow (date, investor_type, market_2, real_deli)
    VALUES (:date, :investor_type, :market_2, :real_deli)
    ON CONFLICT (date, investor_type) DO UPDATE
    SET market_2 = EXCLUDED.market_2,
        real_deli = EXCLUDED.real_deli,
        updated_at = NOW()
    """
    pdf_date_str = extract_date_from_filename(latest_pdf_url)
    pdf_date = pd.to_datetime(pdf_date_str, format="%y%m%d").date()

    for _, row in investor_df.iterrows():
        values = {
            "date": pdf_date,
            "investor_type": row["investor_type"],
            "market_2": row["market_2"],
            "real_deli": row["real_deli"]
        }
        await database.execute(query=query, values=values)

    await database.disconnect()
    print("Investor flow data updated!")

if __name__ == "__main__":
    asyncio.run(main())