# nowl-dev
資産運用AI「Nowl」の開発用リポジトリ  
Development repository for the asset management AI system **Nowl**

---

# Nowl（ノウル）
### 目標 / Goal
1・ **AIを活用した、資産運用のAIシステム**
   → AI-powered asset management system.
   
2・ **ユーザーの人生を導くライフパートナーシステム**
   → Life Partner System that Guides Users'Lives.

---

## 🎯 主な目的 / Purpose
- 金融知識がなくても簡単に資産管理できる  
  → Easy asset management without financial expertise  
- 家計や目標に連動した自動運用機能  
  → Automated investment based on budgets and goals  
- 市場や経済の動きをAIで分析・提案  
  → AI-driven market & economic analysis with investment suggestions
- 分析や提案の学習機能（市場の動きの理由などの解説）
  → Learning features for analysis and suggestions (expanation of market movements , etc)

---

## ⚙️ 技術スタック（予定） / Tech Stack (Planned)
- Frontend: React  
- Backend: Spring Boot / FastAPI  
- Analysis Engine: Python (Scikit-learn, TensorFlow)  
- Database: PostgreSQL / TimescaleDB  
- Others: Kafka, OAuth2.0, JWT, Keycloak

---

## 📌 開発ログ / Development Log
開発経過や画面設計なども順次記載していきます。  
We will update progress logs and UI designs here as development proceeds.

---

## 🧩 モジュール構成 / Module Structure

| モジュール名 / Module | 概要 / Description | 主な技術 / Main Tech |
|-----------------------|--------------------|----------------------|
| **nowl_frontend** | フロントエンド（UI） | React, Tailwind CSS |
| **nowl-backend** | APIサーバー | FastAPI / Spring Boot |
| **nowl-engine** | AI分析・取引ロジック | Python (Scikit-learn, TensorFlow) |
| **nowl-python** | 市場・経済データ収集モジュール | Playwright, PostgreSQL |

---

# 📈 株価・指数データ取得  / Market Data Collector 

**ファイル:**  
`nowl-python/fetch_market_data_full.py`

---

### 🧠 概要 / Overview
このモジュールは、主要な株価指数・為替・暗号資産などの市場データを  
自動的に取得・整形し、FastAPI経由でNowlのデータベースに送信します。  

This module automatically collects and structures real-time and historical market data  
for major indices, forex pairs, and cryptocurrencies,  
and sends them to the Nowl database through the FastAPI backend.

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | Yahoo Finance (`yfinance`), Alpaca API (planned) |
| **対象市場 / Target Markets** | Nikkei 225, TOPIX, USD/JPY, EUR/JPY, S&P500, NASDAQ, BTC/USD, etc. |
| **データ粒度 / Data Interval** | 1分足 (`1m`)（過去データ）<br>リアルタイム更新機能も将来実装予定 |
| **保存先 / Storage** | PostgreSQL / TimescaleDB |
| **送信API / API Endpoint** | `POST /market-index-candles`（FastAPI側） |
| **最新データ取得 / Latest API** | `GET /market-index-candles/latest`（重複防止） |

---

### ⚙️ 主な処理フロー / Processing Flow

1. **市場リストの定義 / Market List Definition**
   ```python
   MARKETS = [
       {"symbol": "^N225", "marketType": "N225"},
       {"symbol": "^TPX", "marketType": "TOPIX"},
       {"symbol": "JPY=X", "marketType": "USD/JPY"},
       {"symbol": "BTC-USD", "marketType": "BTC/USD"},
       {"symbol": "^GSPC", "marketType": "S&P500"},
       {"symbol": "^TNX", "marketType": "米長期金利"},
   ]

2. **データ取得 / Fetch Historical Data**
   
   使用例 / Example:
   ```python
   data = yf.Ticker(symbol).history(start=start, end=end, interval="1m")
   ```

3. **昼休み・重複除外 / Remove Midday Breaks**
-	日本市場の11:30〜12:30を除外
4. **重複チェック / Prevent Duplicates**
-	FastAPIの /market-index-candles/latest で最新時刻を取得し、差分のみ送信
5. **API送信 / Send to API**
```
  payload = {
    "symbol": symbol,
    "marketType": market_type,
    "timestamp": ts_str,
    "open": float(row['Open']),
    "high": float(row['High']),
    "low": float(row['Low']),
    "close": float(row['Close']),
    "volume": int(row['Volume'])
}
requests.post(URL_POST, json=payload)
```
---

### 🕐 実行方法 / How to Run

**▶ 指定日を取得**
```
python fetch_market_data_full.py --start-date 2025-10-07
```

**▶ 範囲を指定して取得**
```
python fetch_market_data_full.py --start-date 2025-09-01 --end-date 2025-09-05
```

# 📉 CME先物データ取得  / CME Futures Collector 

**ファイル:**  
`nowl-python/fetch_cme_futures_full.py`

---

### 🧠 概要 / Overview**
このモジュールは、CME（シカゴ・マーカンタイル取引所）の先物データ（例：日経平均先物など）を
自動的に取得し、Nowl のデータベースに送信します。
1分足データが利用できない場合は日足を自動的に使用します。

This module automatically fetches CME futures data (e.g., Nikkei futures)
and sends them to the Nowl database through FastAPI.
If minute-level data are unavailable, it falls back to daily candles.

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | Yahoo Finance (`yfinance`)|
| **対象市場 / Target Markets** | Nikkei 225 USD (NKD=F), Nikkei 225 JPY (NIY=F) |
| **データ粒度 / Data Interval** | 1分足 (`1m`)（過去データ）<br>リアルタイム更新機能も将来実装予定 |
| **保存先 / Storage** | PostgreSQL / TimescaleDB |
| **送信API / API Endpoint** | `POST /market-index-candles`（FastAPI側） |
| **最新データ取得 / Latest API** | `GET /market-index-candles/latest`（重複防止） |
| **リトライ回数 / Retry Limit** | 3回（送信失敗時） |

---

### ⚙️ 主な処理フロー / Processing Flow

1. **対象銘柄の定義 / Define Futures List**
```
CME_FUTURES = [
    {"symbol": "NKD=F", "marketType": "CME_NKD_USD"},
    {"symbol": "NIY=F", "marketType": "CME_NIY_YEN"},
]
```
2. **データ取得 / Fetch Candles**
```
data = yf.Ticker(symbol).history(period="5d", interval="1m")
```
- 1分足 (1m) を優先的に取得
- 取得できない場合は interval="1d" で日足に切り替え
- すべての時刻を JST に変換

3.	**最新データの比較 / Compare with Latest**
```
latest_ts = get_latest_timestamp(symbol, market_type)
if latest_ts and ts_str <= latest_ts:
    continue
```
- FastAPI /market-index-candles/latest で最新のtimestampを取得
- 重複データをスキップ

4. **送信 / Send to API**
```
payload = {
    "symbol": symbol,
    "marketType": market_type,
    "timestamp": ts_str,
    "open": float(row['Open']),
    "high": float(row['High']),
    "low": float(row['Low']),
    "close": float(row['Close']),
    "volume": int(row['Volume']),
    "granularity": granularity
}
send_candle(payload)
```
- JSON形式でFastAPIに送信
- ステータス200が返らない場合は3回までリトライ

---

### 🕐 実行方法 / How to Run
指定なし（直近データ取得）
```
python fetch_cme_futures_full.py
```
日付を指定して取得（例：2025年9月8日以降）
```
python fetch_cme_futures_full.py 2025-09-08
```

---

### 🗃️ 出力データ例 / Example Payload
```
{
  "symbol": "NKD=F",
  "marketType": "CME_NKD_USD",
  "timestamp": "2025-10-09T07:30:00",
  "open": 42920.0,
  "high": 42980.0,
  "low": 42850.0,
  "close": 42910.0,
  "volume": 1542,
  "granularity": "1m"
}
```

### 🔁 今後の拡張 / Future Enhancements
-	取引時間外データの除外フィルタ
-	自動スケジューリング（cron / Airflow / Prefect）対応
-	取引ボリュームと指数の相関分析（AI分析連携）

---

# 🪙 米国10年期待インフレ率データ取得 / U.S. 10-Year Breakeven Inflation Rate Collector

**ファイル名 / Filename:**
`nowl-python/fetch_t10yie_all.py`

---

### 🧠 概要 / Overview
このモジュールは、FRED（Federal Reserve Economic Data）から
米国10年物ブレークイーブン・インフレ率（T10YIE）の全期間データを取得し、
CSVファイルとしてローカルに保存します。

This module fetches the 10-Year Breakeven Inflation Rate (T10YIE)
from the Federal Reserve Economic Data (FRED) API and stores the full historical data as a local CSV file.

---

### 🔧 主な仕様 / Specifications
| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | FRED API |
| **シリーズID / Series ID** | T10YIE |
| **取得期間 / Data Range** | 1990年1月1日 ～ 現在 / Jan 1, 1990 – Present |
| **出力形式 / Output Format** | CSV（T10YIE_all.csv） |
| **タイムゾーン / Timezone** | JST（UTC → JST 変換） |
| **APIキー / API Key** | .env ファイルから FRED_API_KEY を読み込み |

---

### ⚙️ 主な処理フロー / Processing Flow
1. **環境変数の読み込み / Load Environment Variables**
```
from dotenv import load_dotenv
load_dotenv()
FRED_API_KEY = os.getenv("FRED_API_KEY")
```
2. **APIリクエスト生成 / Build FRED API Request**
```
url = "https://api.stlouisfed.org/fred/series/observations"
params = {
    "series_id": "T10YIE",
    "api_key": FRED_API_KEY,
    "file_type": "json",
    "observation_start": "1990-01-01",
    "observation_end": datetime.today().strftime("%Y-%m-%d"),
}
```
3. **データ取得と整形 / Fetch & Clean Data**
```
response = requests.get(url, params=params)
data_json = response.json().get("observations", [])
df = pd.DataFrame(data_json)
df["date"] = pd.to_datetime(df["date"])
df.set_index("date", inplace=True)
df.index = df.index.tz_localize("UTC").tz_convert(JST)
df["value"] = pd.to_numeric(df["value"], errors="coerce")
df = df.rename(columns={"value": "Close"}).sort_index()
```
4. **CSV保存 / Save to CSV**
```
df.to_csv("T10YIE_all.csv")
print(f"CSVに保存しました: {len(df)} 行")
```

---

### 🕐 実行方法 / How to Run
```
python fetch_t10yie_all.py
```

---

### 🗃️ 出力例 / Example Output (T10YIE_all.csv)
| date | Close |
|-------------|--------------------|
| 1990-01-02 | 3.97 |
| 1990-01-03 | 3.96 |
| … | … |
| 2025-10-09 | 2.15 |

---

### 🧩 利用用途 / Usage in Nowl
取得したT10YIEデータは、
-	米国の長期的なインフレ期待の把握
- 金利動向・資産配分ロジックの補助変数
- 経済分析モジュール（nowl-engine）での回帰モデル入力
などに活用予定。
The data will serve as a macroeconomic indicator for AI-driven portfolio logic and inflation analysis within Nowl.

---

### 🔁 今後の拡張 / Future Enhancements
-	他のFRED系列（例：CPI, PCE, T10Y2Y）も追加取得予定
-	PostgreSQL連携（自動アップロード）
-	定期自動更新（cron / Airflow / Prefect対応）

---


# 💹 実質金利算出モジュール / Real Interest Rate Calculator

**ファイル名 / Filename:** 
`nowl-python/calc_real_tate_csv.py`

### 🧠 概要 / Overview

このモジュールは、
-	米国10年国債利回り（^TNX）
-	10年期待インフレ率（T10YIE）
を取得し、「実質金利（＝名目金利 − 期待インフレ率）」を自動算出・送信します。

This module calculates and uploads the Real 10-Year Interest Rate,
derived from the U.S. Treasury Yield (^TNX) and the 10-Year Breakeven Inflation Rate (T10YIE).

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | Yahoo Finance (^TNX) + FRED CSV (T10YIE_all.csv) |
| **出力先 / Output Destination** | FastAPI (POST /market-index-candles) |
| **指標 / Indicators** | - 米長期金利（Nominal 10Y）- 10年期待インフレ率（T10YIE）- 実質金利（Real Rate） |
| **出力形式 / Output Format** | FastAPI POST JSON Payload |
| **タイムゾーン / Timezone** | JST（UTC → JST 変換） |
| **重複防止 / Duplicate Prevention** | FastAPI に対して日付＋シンボルでチェック |

---

### ⚙️ 主な処理フロー / Processing Flow

1. **米長期金利データ取得 / Fetch U.S. 10Y Treasury Yield**
```
import yfinance as yf
data = yf.Ticker("^TNX").history(start="2025-10-01", end="2025-10-02", interval="1d")
```
 → JST変換・ソート・重複排除を実施。

2. **10年期待インフレ率データ取得 / Fetch T10YIE from CSV**
```
df = pd.read_csv("T10YIE_all.csv", parse_dates=["date"])
df.index = df.index.tz_localize("UTC").tz_convert(JST)
day_df = df.loc[target_date.strftime("%Y-%m-%d") : target_date.strftime("%Y-%m-%d")]
```

3. **実質金利の算出 / Calculate Real Rate**
```
real_rate = tnx_close - t10yie_close
```

4. **送信処理 / Send to FastAPI**
```
payload = {
    "symbol": "REAL_RATE",
    "marketType": "実質金利",
    "timestamp": target_date.strftime("%Y-%m-%dT%H:%M:%S"),
    "open": real_rate,
    "high": real_rate,
    "low": real_rate,
    "close": real_rate,
    "volume": 0
}
requests.post(URL_POST, json=payload)
```

5. **重複チェック / Prevent Duplicates**
```
check_resp = requests.get(URL_CHECK, params={"symbol": payload["symbol"], "date": date_str})
if existing and len(existing) > 0:
    print("既に存在 → スキップ")
```

---

### 🕐 実行方法 / How to Run

単日実行 / Single Day
```
python calc_real_tate_csv.py --start-date 2025-10-08
```

範囲指定 / Range Execution
```
python calc_real_tate_csv.py --start-date 2025-10-01 --end-date 2025-10-09
```

---

### 🗃️ 出力例 / Example Output (FastAPI Payload)
```
{
  "symbol": "REAL_RATE",
  "marketType": "実質金利",
  "timestamp": "2025-10-08T00:00:00",
  "open": 2.03,
  "high": 2.03,
  "low": 2.03,
  "close": 2.03,
  "volume": 0
}
```

---

### 🧩 関連ファイル / Related Files

| ファイル名 / File | 役割 / Description |
|-------------|--------------------|
| fetch_t10yie_all.py| 10年期待インフレ率（T10YIE）を取得・CSV保存 |
| calc_real_tate_csv.py | 実質金利を計算・送信 |
| fetch_market_data_full.py | 株価・指数データ取得（Nowl共通基盤） |

---

### 🧠 分析活用 / Analytical Use

- インフレ期待の動向と実質金利の差から投資環境のリスク評価を実施
-	金利・物価の乖離をAIエンジンの特徴量として学習利用
-	将来的にはNowlの**資産配分提案（ポートフォリオ最適化）**に連携予定

---

### 🔁 今後の拡張 / Future Enhancements
-	週次または日次自動実行（cron / Airflow対応）
-	実質短期金利（2Y / 5Y）への拡張
-	FREDからのT10YIE自動更新との統合

---


# 📈 経済指標データ取得 / Economic Calendar Scraper

**ファイル名 / Filename:**  
`fetch_economic_calendar.py`

**目的 / Purpose:**  
- 経済指標カレンダー（Investing.com）から当日・前日のデータを自動取得し、PostgreSQL に格納。AI分析やUI表示の基礎データとして活用。  
Automatically fetches daily and previous-day economic indicators from *Investing.com*  
and stores them in PostgreSQL for AI analysis and UI display.

---

### 🧠 主な処理フロー / Processing Flow

1. Playwrightでサイトへアクセス  
   → Access Investing.com using Playwright  
2. 「Today」または「Yesterday」タブを選択してデータ取得  
   → Select the target tab and scrape the event table  
3. 各指標の情報を抽出：  
   - 国コード / Country code  
   - 指標名 / Indicator name  
   - 結果・予想・前回値 / Actual, Forecast, Previous  
   - 発表ステータス（結果あり・未発表）/ Status  
   - 重要度（LOW / MEDIUM / HIGH）/ Importance  
4. PostgreSQLへUpsert（既存データの自動更新）  
   → Insert or update existing records automatically  

---

### 🗃️ 関連テーブル / Related Table  
**Table:** `economic_calendar`

| カラム名 / Column | 説明 / Description |
|-------------------|--------------------|
| event_datetime | 発表日時 / Event datetime |
| country_code | 国コード / Country code |
| indicator_name | 指標名 / Indicator name |
| actual_value | 結果値 / Actual value |
| forecast_value | 予想値 / Forecast value |
| previous_value | 前回値 / Previous value |
| status | 発表状況（結果あり・未発表） / Publication status |
| importance | 重要度（HIGH / MEDIUM / LOW） / Importance level |
| last_updated | 最終更新日時 / Last updated timestamp |

---

### 🔁 自動実行（予定） / Automation (Planned)
このスクリプトは将来的に **cronジョブ** または **Airflow / Prefect** により  
1日1回（例：日本時間 8:00）自動実行予定。  
The script will be automated via **cron** or **Airflow / Prefect**,  
executed once per day (e.g., 8:00 JST).

これにより、Nowl の経済カレンダー画面等は常に最新情報を反映し、  
AI分析も最新の経済状況を元に実行されるようになります。  
This ensures Nowl’s economic calendar etc and AI models always use up-to-date data.

---

### 🧠 次ステップ / Next Steps 
- 政策金利・要人発言データの追加  
  → Add central bank rates & key figure comments
- 自動スケジューリング（cron / Airflow / Prefect）対応
  → Automated scheduling (cron / Airflow / Prefect) response
- 経済指標 × 市場反応のAI分析連携  
  → Correlation analysis between indicators and market reactions 
- 自動取引エンジンとの統合
  → Integrate with automated trading engine

---

# 🏛️ FOMCイベントデータ取得 / FOMC Event Scraper

**ファイル名 / Filename:**
`nowl-python/economic_data/events/fetch_fomc.py`

### 🧠 概要 / Overview

このモジュールは、FRB（米連邦準備制度理事会） の公式サイトから
FOMC（Federal Open Market Committee）の開催日程および関連資料（PDF・会見URLなど）を自動取得し、
PostgreSQLの economic_events テーブルに保存します。

This module automatically scrapes the official Federal Reserve website to retrieve
the schedule and materials (PDFs, press conferences, etc.) of each FOMC meeting,
and stores the data into the economic_events table in PostgreSQL.

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | Federal Reserve - FOMC Calendars |
| **保存先 / Storage** | PostgreSQL (economic_events table) |
| **主要ライブラリ / Libraries** | requests, BeautifulSoup4, pdfplumber, psycopg2 |
| **抽出対象 / Target Data** | 開催日・各種資料URL（声明文PDF・議事要旨PDF・会見・経済見通し）など |
| **PDFテキスト抽出 / PDF Text Extraction** | pdfplumber を使用して声明文PDFから全文テキストを抽出 |

---

### ⚙️ 主な処理フロー / Processing Flow

1. **FOMCページへアクセス / Access FOMC Calendar Page**
https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm にアクセスしてHTMLを取得。

2. **年ごとの会合を抽出 / Parse Yearly Panels**
各年度ごとの <div class="panel panel-default"> からFOMCスケジュールを解析。

3. **会合ごとの詳細取得 / Extract Meeting Details**
	-	開催年月日（例：2025年7月30日）
	-	各資料リンク（声明文・議事録・会見・経済見通し）
	-	各リンクのPDFやHTMLを取得

4. **声明文PDFのテキスト抽出 / Extract Text from Statement PDF**
```
with pdfplumber.open(BytesIO(r.content)) as pdf:
    for page in pdf.pages:
        text_content += page.extract_text() + "\n"
```

5. **PostgreSQLへ保存（Upsert対応） / Save to PostgreSQL**
	-	新規データは挿入（INSERT）
	-	既存データは更新（UPDATE）
	-	既に text_extracted = True の行は再抽出をスキップ

---

### 🗃️ 関連テーブル / Related Table

Table: economic_events

| カラム名 / Column | 説明 / Description |
|-------------------|--------------------|
| event_date | 会合日 / Meeting date |
| country_code | 国コード（常にUS） / Country code |
| event_name | イベント名（例：FOMC） / Event name |
| statement_pdf_url | 声明文PDF URL / Statement PDF |
| press_conf_url |記者会見URL / Press conference URL |
| minutes_pdf_url | 議事要旨PDF URL / Minutes PDF|
| projection_pdf_url | 経済見通しPDF URL / Projection materials |
| text_content | 声明文の抽出テキスト / Extracted statement text |
| description | 資料概要（Statement, Minutesなど） / Description of files |
| text_extracted | テキスト抽出済みかどうか / Flag for text extraction |

---

### 🕐 実行方法 / How to Run
```
# FOMCイベントを全件取得してDBに保存
python fetch_fomc.py
```
実行後、コンソールに以下のように出力されます：
```
Statement PDF取得成功: 2025年7月31日
3 件のFOMCイベントを保存しました
```

---

### 🔁 自動実行（予定） / Automation (Planned)

- 将来的に cronジョブ または Airflow により、
   → 週1回（月曜 8:00 JST） 自動で更新予定。
This scraper will be automated via cron or Airflow,
scheduled weekly (e.g., every Monday at 8:00 JST).

- 抽出テキストの自然言語処理（NLP）解析
   → Sentiment / Topic / Policy stance の分類
-	FOMC議事録と市場反応（ドル円・S&P500）の相関分析
   → Correlation between FOMC tone and market movement
-	Nowlダッシュボードへの要約表示
   → Summary display in Nowl’s macro insight section

---


© 2025 Owlione / Nowl Project