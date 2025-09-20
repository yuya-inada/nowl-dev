# test_camelot.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import camelot
import re

# 1. JPXページからPDFリンクを取得
JPX_URL = "https://www.jpx.co.jp/markets/statistics-equities/investor-type/index.html"
response = requests.get(JPX_URL)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")

# ページ内のPDFリンクをすべて抽出
pdf_links = [
    urljoin(JPX_URL, a["href"])
    for a in soup.find_all("a", href=True)
    if a["href"].lower().endswith(".pdf")
]

# 2. PDFリンクから日付を抽出する関数
def extract_date_from_filename(url):
    # ファイル名に YYMMDD の形式で日付が含まれている想定
    match = re.search(r"(\d{6})\.pdf", url)
    return match.group(1) if match else None

# PDFリンクと日付をセットに
pdf_with_dates = [(url, extract_date_from_filename(url)) for url in pdf_links]
# 日付が取れたものだけ残す
pdf_with_dates = [(url, d) for url, d in pdf_with_dates if d]

# 日付でソートして最新PDFを取得
latest_pdf_url = max(pdf_with_dates, key=lambda x: x[1])[0] if pdf_with_dates else None
print("Latest PDF URL:", latest_pdf_url)

# 3. PDFを保存
pdf_filename = "latest_investor_flow.pdf"
if latest_pdf_url:
    pdf_data = requests.get(latest_pdf_url)
    with open(pdf_filename, "wb") as f:
        f.write(pdf_data.content)
    print("PDF downloaded:", pdf_filename)

    # 4. Camelotで読み取り
    tables = camelot.read_pdf(pdf_filename, pages="all")
    print(f"抽出した表の数: {len(tables)}")

    if tables:
        print("最初の表プレビュー:")
        print(tables[0].df.head())

        # --- 動作チェック用: 投資主体列がある表を表示 ---
        for i, t in enumerate(tables):
            if "投資主体" in t.df.values:
                print(f"\n候補表 {i}:")
                print(t.df.head())
else:
    print("PDFリンクが見つかりませんでした")