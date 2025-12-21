# nowl-dev
資産運用AI「Nowl™️（商標出願中）」の開発用リポジトリ  
Development repository for the asset management AI system **Nowl**

---

# Nowl（ノウル）
### 目標 / Goal

1 - **AIを活用した、資産運用のAIシステム**
   → AI-powered asset management system.

2 - **ユーザーの人生を導くライフパートナーシステム**
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

## ⚠️ NowlのMVP開発段階でのスクレイピング利用

- 現段階では、研究開発目的として、公開情報から一部自動データ取得を行っています。
   → At this stage, we are conducting partial automated data acquisition from publicly available information for research and development purposes.

- 商用利用・再配布は行わず、将来的には公的API・ライセンスデータソースに完全移行予定です。
   → We do not engage in commercial use or redistribution, and we plan to fully transition to public APIs and licensed data sources in the future.

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
| **nowl-agent** | AI分析・取引ロジック | Python (Scikit-learn, TensorFlow) |
| **nowl-python** | 市場・経済データ収集モジュール | Playwright, PostgreSQL |

---

---

## 🤖 AIエージェント構成 / AI Agent Architecture

### 🧠 概要 / Overview

Nowl は単なる「LLMを使ったアプリケーション」ではなく、  
**複数のAIエージェントが協調して意思決定を行う AI Agent System** として設計されています。

LLMは最終判断者ではなく、  
**判断を補助する「推論エンジン」**として扱われます。

Nowl の中核は、  
ユーザー意図を解釈し、タスクを分解し、  
「実行するか・止めるか・人間レビューに回すか」を判断する  
**Orchestrator（Coordinator Agent）**です。

---

Nowl is designed as an **AI Agent System**,  
not a simple LLM-powered application.

The LLM is treated as a *reasoning engine*,  
while the **Orchestrator (Coordinator Agent)** controls decision-making, execution flow, and safety.

---

### 🏗️ 全体構成図 / High-Level System Diagram

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                               Frontend (React)                           │
│  - Prompt Preview UI / Execute UI                                        │
│  - Agent Selector (Market / Goal / Household / Education)                │
│  - Decision Timeline (判断ログ閲覧)                                        │
└───────────────┬───────────────────────────────────────────────┬──────────┘
                │                                               │
                │HTTP                                           │HTTP
                ▼                                               ▼
┌──────────────────────────────┐                      ┌──────────────────────┐
│        Backend API           │                      │   Auth (optional)    │
│  (Spring Boot / FastAPI)     │                      │ JWT / Keycloak etc   │
│  - /agent/run                │                      └──────────────────────┘
│  - /prompt/preview           │
│  - /llm/execute              │
│  - /logs/query               │
└───────────────┬──────────────┘
                │
                │ Orchestration Request
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Coordinator Agent (Orchestrator)                            │
│  - Intent classification                                                 │
│  - Task decomposition                                                    │
│  - Execution control / Gatekeeping                                       │
│  - Final decision & review request                                       │
└───────────────┬──────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Specialist Agents (Workers)                           │
│  Market / Goal / Household / Education / Policy / Portfolio              │
│                                                                          │
│  共通内部フロー:                                                           │
│   Data Fetch → Feature Summary → Prompt Builder → LLM Request            │
│   → Output Summary → Shared Memory                                       │
└───────────────┬──────────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│               Shared Memory / State Layer (PostgreSQL)                   |
│  - agent_runs / agent_outputs                                            │
│  - prompts / llm_responses                                               │
│  - decision_log                                                          │
└───────────────┬──────────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    llm_runner (Execution Service)                        │
│  - Model selection / Retry / Cost tracking                               |
│  - JSON validation / Fail-safe                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

# 🧭 Orchestrator（Coordinator Agent）

## 役割 / Responsibilities
   - ユーザー意図の分類
   - タスク分解と実行順序の決定
	- 各Agentの出力を統合・矛盾調停
	- 実行可否の判断（実行 / 停止 / 人間レビュー）
The Orchestrator acts as a gatekeeper,
ensuring safety, cost control, and explainability.

## 🧑‍💼 Specialist Agents（専門エージェント）
### Nowl はドメイン別に分離された複数のAgentを持ちます。

例 / Examples:
	- **Market Agent：市場・指数・経済指標分析**
	- **Goal Agent：人生目標・中長期計画**
	- **Household Agent：家計・キャッシュフロー**
	- **Education Agent：学習・解説**
	- **（将来）Policy / Risk / Portfolio Agent**

各Agentは共通の処理パターンを持ちます。/ Each agent follows the same internal pipeline:
	1. **Data Fetch (DB / API)**
	2.	**Feature Summary**
	3.	**Prompt Builder（prompt_preview）**
	4.	**LLM Execution（via llm_runner）**
	5.	**Output Summary**
	6.	**Write to Shared Memory**

### 🧠 Shared Memory（判断の共通基盤）

Shared Memory は「会話履歴」ではなく、判断材料と意思決定の履歴を保存する共通掲示板です。

保存される情報:
	- Agent実行単位（run_id）
	- Agentごとの出力・スコア
	- レンダリング済みプロンプト
	- LLMの生出力・解析結果
	- 最終判断と理由

This enables:
	- 完全なトレーサビリティ
	- 人間によるレビュー・監査
	- 判断プロセスの再現性

### 🤖 Why Nowl is an AI Agent
	- 判断主体は LLM ではなく Orchestrator
	- 実行は常にゲート制御される
	- 複数Agentが状態を共有して協調
	- すべての推論が記録・検証可能
The LLM is a tool.
The system is the intelligence.

---

# 📈 株価・指数データ取得  / Market Data Collector 

**ファイル:**  
`nowl-python/fetch_market_data_full.py`

---

### 🧠 概要 / Overview
このモジュールは、主要な株価指数・為替・暗号資産・CME先物などの市場データを  
自動的に取得・整形し、FastAPI経由でNowlのデータベースに送信します。  

This module automatically collects and structures real-time and historical market data  
for major indices, forex pairs, and cryptocurrencies,  
and sends them to the Nowl database through the FastAPI backend.

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | Yahoo Finance (`yfinance`), Alpaca API (planned) |
| **対象市場 / Target Markets** | Nikkei225, TOPIX, USD/JPY, EUR/JPY, S&P500, NASDAQ, BTC/USD, CME_NKD_USD, CME_NIY_YEN etc. |
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
      {"symbol": "NKD=F", "marketType": "CME_NKD_USD"},
      {"symbol": "NIY=F", "marketType": "CME_NIY_YEN"},
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

## ⚠️ NowlのMVP開発段階でのスクレイピング利用

- 現段階では、研究開発目的として、公開情報から一部自動データ取得を行っています。
   → At this stage, we are conducting partial automated data acquisition from publicly available information for research and development purposes.

- 商用利用・再配布は行わず、将来的には公的API・ライセンスデータソースに完全移行予定です。
   → We do not engage in commercial use or redistribution, and we plan to fully transition to public APIs and licensed data sources in the future.

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
各年度ごとの 
```
<div class="panel panel-default"> 
```
からFOMCスケジュールを解析。

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

# 🏦 日銀金融政策決定会合議事要旨データ取得 / BOJ Minutes Scraper

**ファイル名 / Filename:**
`nowl-python/economic_data/events/fetch_boj.py`

### 🧠 概要 / Overview

このモジュールは、日本銀行（Bank of Japan, BOJ）の公式サイトから
「金融政策決定会合議事要旨（Minutes of the Monetary Policy Meeting）」を自動取得し、
全文テキストを抽出した上で PostgreSQL の economic_events テーブルに保存します。

This module automatically scrapes the official Bank of Japan website to retrieve
the Minutes of the Monetary Policy Meeting (BOJ Minutes),
extracts full text from the linked PDF or HTML files,
and stores the data into the economic_events table in PostgreSQL.

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | 日本銀行 公式サイト - 議事要旨ページ |
| **保存先/Storage** | PostgreSQL（テーブル：economic_events） |
| **主要ライブラリ / Libraries** | requests, BeautifulSoup4, pdfplumber, psycopg2, dotenv |
| **抽出対象 / Target Data** | 公表日、開催日、議事要旨PDF（またはHTML）URL、全文テキスト |
| **PDFテキスト抽出 / PDF Text Extraction** | pdfplumber を使用し全文テキストを抽出 |
| **既存データチェック / Duplicate Check** | 同一URLが既に登録済みの場合はスキップ |

---

### ⚙️ 主な処理フロー / Processing Flow

1.	**BOJ公式ページへアクセス / Access BOJ Minutes Page**
   -  以下URLへリクエストを送信し、HTMLを取得：
   -  https://www.boj.or.jp/mopo/mpmsche_minu/minu_2025/index.htm

2.	**議事要旨リストを解析 / Parse Table of Minutes**
   -  <テーブル/table> 要素を走査し、公表日・開催日・リンクURLを抽出。
   -  リンクが存在しない（＝未発表）場合はスキップ。

3.	**リンク種別の判定 / Determine Link Type**
   -  .pdf → PDFをダウンロードして pdfplumber でテキスト抽出
   -  .html → BeautifulSoupで本文テキストを抽出

4.	**日付処理 / Parse Event Date**
   -  開催日欄から「○月○日」形式の最初の日付を抽出し、
   -  datetime.strptime(f"{date_match} 2025", "%m月%d日 %Y") で変換。
   
5.	**PostgreSQLへ保存 / Save to PostgreSQL**
   -  抽出したイベントを economic_events テーブルへ保存。
   -  同一の event_date + event_name が存在する場合はスキップ（ON CONFLICT DO NOTHING）。

---

### 🗃️ 関連テーブル / Related Table

Table: economic_events

| カラム名 / Column | 説明 / Description |
|-------------|--------------------|
| **event_date** | 開催日 / Meeting date |
| **country_code** | 国コード / Country code |
| **event_name** | イベント名（例：BOJ Munutes）/ Event name |
| **description** | 概要（例：「日銀金融政策決定会合議事要旨2025年⚪︎月⚪︎日」）|
| **statement_pdf_url** | 議事要旨PDFまたはHTMLのURL / Statement PDF or HTML URL |
| **text_content** | 議事要旨の全文テキスト / Extracted minutes text |
| **press_conf_url** | 記者会見URL（該当ない場合NULL） |
| **minutes_pdf_url** | 議事要旨PDF URL |
| **projection_pdf_url** | 経済見通し資料 |

---

### 🕐 実行方法 / How to Run
```
# BOJ議事要旨を取得してDBに保存
python fetch_boj.py
```
実行後、コンソールに以下のように出力されます：
```
7月分の議事要旨は既に登録済みです
8月分の議事要旨テキストは取得できませんでした
2 件のBOJ議事要旨イベントを保存しました
```

---

### 🔁 自動実行（予定） / Automation (Planned)

- スケジュール: 月1回（毎月末）自動で新規議事要旨を取得予定
   → cron または Airflow で定期実行
- NLP分析統合: 抽出テキストの自然言語処理を行い、
   → Sentiment（政策トーン）やTopic（論点）分類をNowl内で可視化予定。
- Nowlホーム画面連携:
   → 取得済み議事要旨を「政策発表イベント」一覧に自動反映予定。

---

### 🧾 備考 / Notes

- BOJサイトでは年ごとにページが分かれているため、年が変わる際は
   → BOJ_MINUTES_URL の年度部分（例：minu_2026）を更新する必要がある。
- 一部月はリンク未公開のためスキップされる場合がある。

---

# 🧾 投資主体別売買動向データ更新モジュール | Investor-Type Data Update Module

**ファイル名 / Filename:**
`nowl-python/update_investor_flow.py`

### 🧠 概要 / Overview

このモジュールは、JPX（日本取引所グループ） の公式サイトから
投資主体別売買動向（投資部門別売買状況）PDF を自動取得し、
各主体（個人・海外投資家・法人・金融機関など）の「売り・買い」データを抽出して
PostgreSQL の investor_flow テーブルへ保存します。

This module automatically retrieves the Investor Type Trading Trends PDF
from the official JPX (Japan Exchange Group) website,
extracts the weekly buy/sell volumes by investor category (Individuals, Foreigners, Institutions, etc.),
and stores the data into the investor_flow table in PostgreSQL.

---

### 🔧 主な仕様 / Specifications

| 項目 / Item | 内容 / Description |
|-------------|--------------------|
| **データソース / Data Source** | JPX公式サイト（投資部門別売買状況）https://www.jpx.co.jp/markets/statistics-equities/investor-type/ |
| **保存先 / Storage** | PostgreSQL (investor_flow table) |
| **主要ライブラリ / Libraries** | requests, BeautifulSoup4, camelot, pandas, databases, asyncio |
| **対象データ / Target Data** | 投資主体別の売買動向（自己・委託・個人・海外・法人・金融機関など） |
| **PDF構造解析 / PDF Parsing** | Camelotを使用して表データを自動抽出 |

---

### ⚙️ 主な処理フロー / Processing Flow

1. **JPX公式ページへアクセス / Access JPX Investor Type Page**
	-	投資部門別売買状況ページから最新のPDFリンクを取得。

2. **PDFファイルの正規化 / Normalize PDF Links**
   -  Chrome拡張由来のURL（chrome-extension://）も正規化して取得可能に。

3. **最新週のPDFを判定 / Detect Latest Weekly Report**
   -  ファイル名の「YYMMWW」形式（例：250902）から週次コードを抽出。

4. **CamelotでPDFテーブルを抽出 / Extract Tables via Camelot**
```
tables = camelot.read_pdf("latest_investor_flow.pdf", pages="all")
```
すべてのページを走査し、投資主体ごとの売買データを収集。

5. **投資主体の分類と集計 / Classify and Aggregate Investor Types**
   -  以下の主体を対象にグルーピングして合計値を算出。

| 投資主体 / Investor Type | 対応ラベル / Keywords |
|-------------|--------------------|
| **Proprietary** | 自己計 / Proprietary |
| **Brokerage** | 委託計 / Brokerage |
| **Individuals** | 個人 / Individuals |
| **Foreigners** | 海外投資家 / Foreigners |
| **Secutities Cos.** | 証券会社 / Securities Cos. |
| **Insitutions** | 法人 / Institutions |
| **Financials** | 金融機関 / Financials |

6. **PostgreSQLへUpsert / Upsert into PostgreSQL**
   -  ON CONFLICT (date, investor_type) により
      - 既存データは更新、新規データは挿入。
      - 更新日時 (updated_at) も自動で記録。

---

### 🗃️ 関連テーブル / Related Table

Table: investor_flow

| カラム名 / Column | 説明 / Description |
|-------------|--------------------|
| **date** | データ対象週の日付（週始まり） / Week start date |
| **investor_type** |投資主体区分（個人・海外・法人など） / Investor category |
| **market_2** | 第2市場（例：東証プライム）の売買高 / Market 2 trade volume |
| **real_deli** | 実際の受渡ベースの売買高 / Real delivery trade volume |
| **updated_at** | 更新日時 / Timestamp of last update |

---

### 🕐 実行方法 / How to Run

```
# 最新のJPX投資主体別PDFを取得してDBに保存
python update_investor_flow.py
```

実行後、コンソールに以下のような出力が表示されます：

```
Latest PDF URL: https://www.jpx.co.jp/.../250902.pdf
PDF downloaded: latest_investor_flow.pdf
Investor flow data updated for week starting 2025-09-08!
```

---

### 📊 出力イメージ / Output Example

| date | investor_type | market_2 | real_deli |
|------|----------------|-----------|------------|
| 2025-09-08 | Individuals | 125430 | -158920 |
| 2025-09-08 | Foreigners | -342000 | 281500 |
| 2025-09-08 | Institutions | 48000 | -29000 |
| 2025-09-08 | Financials | -22000 | 17000 |

---

### 🔁 自動実行（予定） / Automation (Planned)

- **スケジュール: 毎週金曜 18:00 JST に自動更新（cron or Airflow）**
- **Nowl連携: ダッシュボード上で主体別売買フローの時系列チャート表示**
- **将来拡張:**
   -  海外主要市場（NYSE/Nasdaq）の投資主体別データとの比較
   -  投資家フローと指数（日経225・TOPIX・S&P500）の相関分析
   -  Nowl AIモジュールによる主体別センチメント推定（例：「海外投資家のリスクオン傾向」）

---

## ⚠️ NowlのMVP開発段階でのスクレイピング利用

- 現段階では、研究開発目的として、公開情報から一部自動データ取得を行っています。
   → At this stage, we are conducting partial automated data acquisition from publicly available information for research and development purposes.

- 商用利用・再配布は行わず、将来的には公的API・ライセンスデータソースに完全移行予定です。
   → We do not engage in commercial use or redistribution, and we plan to fully transition to public APIs and licensed data sources in the future.

---


© 2025 Owlione / Nowl Project