# nowl-dev
資産運用AI「Nowl」の開発用リポジトリ  
Development repository for the asset management AI system **Nowl**

---

# Nowl（ノウル）  
AIを活用した、資産運用のパートナーシステム  
**Nowl** is an AI-powered partner system for financial asset management.

---

## 🎯 主な目的 / Purpose
- 金融知識がなくても簡単に資産管理できる  
  → Easy asset management without financial expertise  
- 家計や目標に連動した自動運用機能  
  → Automated investment based on budgets and goals  
- 市場や経済の動きをAIで分析・提案  
  → AI-driven market & economic analysis with investment suggestions

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
| **nowl-ui** | フロントエンド（UI） | React, Tailwind CSS |
| **nowl-api** | APIサーバー | FastAPI / Spring Boot |
| **nowl-engine** | AI分析・取引ロジック | Python (Scikit-learn, TensorFlow) |
| **nowl-scraper** | 市場・経済データ収集モジュール | Playwright, PostgreSQL |

---

## 📈 株価・指数データ取得 ① / Market Data Collector ①

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

## 📉 CME先物データ取得 ② / CME Futures Collector ②

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

**📘 補足 / Notes:**
このモジュールは既存の fetch_market_data_full.py と連携し、
Nowl の市場データをグローバルに拡張するための仕組みです。

---

## 🪙 米国10年期待インフレ率データ取得 / U.S. 10-Year Breakeven Inflation Rate Collector

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


## 📈 経済指標データ取得 / Economic Calendar Scraper

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

これにより、Nowl の経済カレンダー画面は常に最新情報を反映し、  
AI分析も最新の経済状況を元に実行されるようになります。  
This ensures Nowl’s economic calendar and AI models always use up-to-date data.

---

## 🧠 次ステップ / Next Steps 
- 政策金利・要人発言データの追加  
  → Add central bank rates & key figure comments
- 自動スケジューリング（cron / Airflow / Prefect）対応
  → Automated scheduling (cron / Airflow / Prefect) response
- 経済指標 × 市場反応のAI分析連携  
  → Correlation analysis between indicators and market reactions 
- 自動取引エンジンとの統合
  → Integrate with automated trading engine

---

© 2025 Owlione / Nowl Project