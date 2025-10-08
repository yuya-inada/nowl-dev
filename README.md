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

## 📈 経済指標データ取得 / Economic Calendar Scraper

**ファイル名 / Filename:**  
`fetch_economic_calendar_today_with_status_and_importance.py`

**目的 / Purpose:**  
経済指標カレンダー（Investing.com）から当日・前日のデータを自動取得し、  
PostgreSQL に格納。AI分析やUI表示の基礎データとして活用。  
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

## 🔁 自動実行（予定） / Automation (Planned)
このスクリプトは将来的に **cronジョブ** または **Airflow / Prefect** により  
1日1回（例：日本時間 8:00）自動実行予定。  
The script will be automated via **cron** or **Airflow / Prefect**,  
executed once per day (e.g., 8:00 JST).

これにより、Nowl の経済カレンダー画面は常に最新情報を反映し、  
AI分析も最新の経済状況を元に実行されるようになります。  
This ensures Nowl’s economic calendar and AI models always use up-to-date data.

---

## 🧠 次ステップ / Next Steps
- 経済指標 × 市場反応のAI分析連携  
  → Correlation analysis between indicators and market reactions  
- 政策金利・要人発言データの追加  
  → Add central bank rates & key figure comments  
- 自動取引エンジンとの統合  
  → Integrate with automated trading engine

---

© 2025 Owlione / Nowl Project