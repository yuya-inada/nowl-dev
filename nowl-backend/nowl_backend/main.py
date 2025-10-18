import os
from fastapi import FastAPI, Query, HTTPException
from contextlib import asynccontextmanager
from databases import Database
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date, time, timedelta
import pytz
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import calendar
from typing import List, Optional, Dict

load_dotenv("/Users/inadayuuya/nowl-dev/.env")

# --------------------------
# DB接続設定
# --------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file")
database = Database(DATABASE_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

# --------------------------
# FastAPI インスタンス
# --------------------------
app = FastAPI(lifespan=lifespan)

# --------------------------
# CORS 設定
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# ルート確認
# --------------------------
@app.get("/")
async def root():
    return {"message": "Nowl FastAPI backend is running!"}

@app.get("/dbtest")
async def db_test():
    query = "SELECT 1"
    result = await database.fetch_one(query)
    return {"result": result}

# --------------------------
# チャート用データ取得
# --------------------------
@app.get("/market-index-candles")
async def get_candles(
    symbol: str = Query(...),
    from_: Optional[str] = Query(None, alias="from"),
    interval: str = Query("1m"),  # 足種指定
):
    JST = pytz.timezone("Asia/Tokyo")
    from_dt = None

    if from_:
        try:
            # UTC → datetimeに変換
            from_dt_utc = datetime.fromisoformat(from_.replace("Z", "+00:00"))
            # JSTに変換（DBはJST基準）
            from_dt = from_dt_utc.astimezone(JST).replace(tzinfo=None)
            print("🕒 [DEBUG] from_ (UTC):", from_)
            print("🕒 [DEBUG] from_dt (JST補正後):", from_dt)
        except Exception as e:
            print("from_変換エラー:", from_, e)
            from_dt = None

    # interval → PostgreSQL 用 date_trunc 単位
    interval_map = {
        "1m": "minute",
        "2m": "2 minute",
        "3m": "3 minute",
        "4m": "4 minute",
        "5m": "5 minute",
        "10m": "10 minute",
        "15m": "15 minute",
        "30m": "30 minute",
        "60m": "hour",
        "1d": "day",
        "1w": "week",
        "1M": "month",
    }
    trunc_unit = interval_map.get(interval, "minute")

    # ✅ JSTで比較するよう修正
    query = f"""
    WITH grouped AS (
        SELECT
            date_trunc(:trunc_unit, timestamp AT TIME ZONE 'Asia/Tokyo') AS ts,
            symbol,
            MIN(timestamp) AS first_ts,
            MAX(timestamp) AS last_ts,
            MAX(high) AS high,
            MIN(low) AS low,
            SUM(volume) AS volume
        FROM market_index_candles
        WHERE symbol = :symbol
        {"AND (timestamp AT TIME ZONE 'Asia/Tokyo') >= :from_dt" if from_dt else ""}
        GROUP BY ts, symbol
    )
    SELECT 
        g.ts,
        first_candles.open,
        g.high,
        g.low,
        last_candles.close,
        g.volume
    FROM grouped g
    LEFT JOIN market_index_candles AS first_candles
        ON first_candles.symbol = g.symbol AND first_candles.timestamp = g.first_ts
    LEFT JOIN market_index_candles AS last_candles
        ON last_candles.symbol = g.symbol AND last_candles.timestamp = g.last_ts
    ORDER BY g.ts ASC
    """

    values = {"symbol": symbol, "trunc_unit": trunc_unit}
    if from_dt:
        values["from_dt"] = from_dt

    try:
        result = await database.fetch_all(query=query, values=values)
        print(f"✅ {symbol}: {len(result)} 件取得（from_dt={from_dt}）")
        return [
            {
                "timestamp": r["ts"],
                "open": r["open"],
                "high": r["high"],
                "low": r["low"],
                "close": r["close"],
                "volume": r["volume"],
            }
            for r in result
        ]
    except Exception as e:
        print("DB取得エラー:", e)
        return {"error": str(e)}

# --------------------------
# センチメントメーター API
# --------------------------
@app.get("/sentiment")
async def get_sentiment():
    symbols = ["CME_NKD_USD", "CME_NIY_YEN", "^GSPC", "^IXIC", "^DJI"]
    scores = []

    for sym in symbols:
        query = """
            SELECT close
            FROM market_index_candles
            WHERE symbol = :symbol
            ORDER BY timestamp DESC
            LIMIT 2
        """
        rows = await database.fetch_all(query=query, values={"symbol": sym})

        if len(rows) == 2:
            latest, prev = rows[0]["close"], rows[1]["close"]
            if prev and prev != 0:
                change = (latest - prev) / prev
                scores.append(change)

    avg_score = sum(scores) / len(scores) if scores else 0.0
    angle = max(-45, min(45, avg_score * 500))

    return {"angle": angle, "score": avg_score, "symbols_used": symbols}

# --------------------------
# 最新指数まとめ取得 API
# --------------------------
symbols = {
    "日経平均株価": "^N225",
    "S&P500": "^GSPC",
    "NYダウ": "^DJI",
    "NASDAQ": "^IXIC",
    "ドル/円": "JPY=X",
    "ドル/ユーロ": "EURUSD=X",
    "ユーロ/円": "EURJPY=X",
    "ビットコイン": "BTC-USD",
    "日経先物(CME:USD)": "CME_NKD_USD",
    "日経先物(CME:Yen)": "CME_NIY_YEN",
    "米国10年国債利回り": "^TNX",
    "米国10年期待インフレ率": "^T10YIE",
    "実質金利": "REAL_RATE",
}

@app.get("/market-index-latest")
async def get_latest_indices():
    result = []

    for display_name, symbol in symbols.items():
        query = """
            SELECT symbol, day, close
            FROM (
                SELECT 
                    symbol,
                    date_trunc('day', timestamp AT TIME ZONE 'Asia/Tokyo') AS day,
                    last_value(close) OVER (
                        PARTITION BY symbol, date_trunc('day', timestamp AT TIME ZONE 'Asia/Tokyo') 
                        ORDER BY timestamp 
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    ) AS close
                FROM market_index_candles
                WHERE symbol = :symbol
            ) t
            GROUP BY symbol, day, close
            ORDER BY day DESC
            LIMIT 2;
        """
        rows = await database.fetch_all(query=query, values={"symbol": symbol})
        if len(rows) >= 1:
            latest_close = rows[0]["close"]
            prev_close = rows[1]["close"] if len(rows) > 1 else latest_close

            change = latest_close - prev_close
            rate = (change / prev_close * 100) if prev_close != 0 else 0.0

            result.append({
                "symbol": symbol,
                "name": display_name,
                "value": latest_close,
                "change": f"{'+' if change >= 0 else ''}{change:.2f}",
                "rate": f"{'+' if rate >= 0 else ''}{rate:.2f}%",
            })

    return result

# --------------------------
# 投資主体別売買動向 API
# --------------------------
@app.get("/api/investor-flow")
async def get_investor_flow():
    query = """
        SELECT investor_type, SUM(market_2) AS market_2, SUM(real_deli) AS real_deli
        FROM investor_flow
        WHERE date = (SELECT MAX(date) FROM investor_flow)
        GROUP BY investor_type
        ORDER BY investor_type
    """
    rows = await database.fetch_all(query=query)
    result = [
        {
            "investor_type": r["investor_type"],
            "market_2": r["market_2"],
            "real_deli": r["real_deli"]
        }
        for r in rows
    ]
    return result

# --------------------------
# 東証定点観測 API（DBベースで直近5営業日）
# --------------------------
@app.get("/api/market-summary")
async def get_market_summary():
    symbol = "^N225"
    query = """
        SELECT DISTINCT ON (date_trunc('day', timestamp AT TIME ZONE 'Asia/Tokyo'))
            timestamp AT TIME ZONE 'Asia/Tokyo' AS ts_jst,
            close
        FROM market_index_candles
        WHERE symbol = :symbol
        ORDER BY date_trunc('day', timestamp AT TIME ZONE 'Asia/Tokyo') DESC, timestamp DESC
        LIMIT 5
    """
    rows = await database.fetch_all(query=query, values={"symbol": symbol})
    rows = list(reversed(rows))

    result = []
    prev_close = None
    for r in rows:
        ts = r["ts_jst"]
        close = r["close"]
        change = close - prev_close if prev_close is not None else 0
        rate = (change / prev_close * 100) if prev_close else 0.0
        buy_quo = "5兆円"

        result.append({
            "date": ts.strftime("%Y-%m-%d"),
            "nikkei": close,
            "change": f"{'+' if change >= 0 else ''}{change:.2f}",
            "rate": f"{'+' if rate >= 0 else ''}{rate:.2f}%",
            "buy_quo": buy_quo
        })
        prev_close = close

    return result

# --------------------------
# Pydanticモデル（入力バリデーション用）
# --------------------------
class EconomicIndicatorIn(BaseModel):
    date: str
    time: Optional[str] = None
    country_code: str
    country_name: Optional[str] = None
    indicator_name: str
    actual_value: Optional[float] = None
    forecast_value: Optional[float] = None
    previous_value: Optional[float] = None
    importance: Optional[int] = None
    unit: Optional[str] = None

# --------------------------
# 経済指標一覧取得
# --------------------------
@app.get("/economic-indicators")
async def get_economic_indicators(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    country_code: Optional[str] = None,
    indicator_name: Optional[str] = None
):
    query = "SELECT * FROM economic_indicators WHERE 1=1"
    values = {}

    def parse_date(d: str):
        return datetime.strptime(d, "%Y-%m-%d").date()

    # まず指定日／範囲を設定
    target_date = parse_date(date) if date else None
    start = parse_date(start_date) if start_date else None
    end = parse_date(end_date) if end_date else None

    if target_date:
        query += " AND date = :date"
        values["date"] = target_date
    if start:
        query += " AND date >= :start_date"
        values["start_date"] = start
    if end:
        query += " AND date <= :end_date"
        values["end_date"] = end
    if country_code:
        query += " AND country_code = :country_code"
        values["country_code"] = country_code
    if indicator_name:
        query += " AND indicator_name = :indicator_name"
        values["indicator_name"] = indicator_name

    query += " ORDER BY date ASC, time ASC"

    rows = await database.fetch_all(query=query, values=values)

    # 今日のデータがない場合 → 最新の実績日を取得
    # データが存在しなければ範囲内の最新日を返す
    if len(rows) == 0 and (start or end):
        latest_row = await database.fetch_one(
            query="""
            SELECT MAX(date) AS latest_date
            FROM economic_indicators
            WHERE 1=1
            """ + (" AND date >= :start_date" if start else "") +
            (" AND date <= :end_date" if end else ""),
            values={k: v for k, v in values.items() if k in ["start_date", "end_date"]}
        )
        latest_date = latest_row["latest_date"] if latest_row else None
        if latest_date:
            rows = await database.fetch_all(
                query="SELECT * FROM economic_indicators WHERE date = :latest_date ORDER BY time ASC",
                values={"latest_date": latest_date}
            )

    return [dict(r) for r in rows]

# --------------------------
# 経済指標の追加（安全版）
# --------------------------
@app.post("/economic-indicators")
async def create_economic_indicator_safe(indicator: EconomicIndicatorIn):
    data = indicator.dict()
    print("受信 payload:", data)

    # date文字列 → datetime.date に変換
    try:
        data["date"] = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"日付形式が不正です: {e}")

    # time文字列 → datetime.time に変換
    if data.get("time"):
        try:
            h, m, s = map(int, data["time"].split(":"))
            data["time"] = time(h, m, s)
        except Exception:
            data["time"] = None
    else:
        data.pop("time", None)  # NoneならDBに渡さない

    # unit が None の場合は空文字に
    if data.get("unit") is None:
        data["unit"] = ""

    # actual_value, forecast_value, previous_value は文字列化
    for key in ["actual_value", "forecast_value", "previous_value"]:
        val = data.get(key)
        if val in ("", "-", None):
            data[key] = None
        else:
            data[key] = str(val)

    # importance を整数に変換（nullable）
    if data.get("importance") is not None:
        try:
            data["importance"] = int(data["importance"])
        except Exception:
            data["importance"] = None

    # 重複チェック
    check_query = """
    SELECT id FROM economic_indicators
    WHERE date = :date
      AND country_code = :country_code
      AND indicator_name = :indicator_name
    """
    existing = await database.fetch_one(query=check_query, values={
        "date": data["date"],
        "country_code": data["country_code"],
        "indicator_name": data["indicator_name"]
    })
    if existing:
        return {"id": existing["id"], "message": "既に存在するためスキップしました"}

    # INSERT
    insert_query = """
    INSERT INTO economic_indicators (
        date, time, country_code, country_name, indicator_name,
        actual_value, forecast_value, previous_value, importance, unit,
        created_at, updated_at
    )
    VALUES (
        :date, :time, :country_code, :country_name, :indicator_name,
        :actual_value, :forecast_value, :previous_value, :importance, :unit,
        NOW(), NOW()
    )
    RETURNING id
    """
    try:
        record = await database.fetch_one(query=insert_query, values=data)
        return {"id": record["id"], "message": "経済指標を追加しました"}
    except Exception as e:
        print("DB INSERT エラー:", e)
        raise HTTPException(status_code=500, detail=f"DB INSERT エラー: {e}")

# --------------------------
# 今日の経済カレンダー
# --------------------------
@app.get("/economic-calendar/day")
async def get_calendar_day(date: str = Query(None, description="YYYY-MM-DD")):
    JST = pytz.timezone("Asia/Tokyo")
    target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now(JST).date()

    query = """
        SELECT event_datetime, country_code, indicator_name,
               actual_value, forecast_value, previous_value,
               status, importance
        FROM economic_calendar
        WHERE DATE(event_datetime) = :target_date
        ORDER BY event_datetime ASC
    """
    try:
        rows = await database.fetch_all(query=query, values={"target_date": target_date})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    events = []
    for r in rows:
        r_dict = dict(r)  # ← Record を dict に変換
        dt = r_dict["event_datetime"]
        events.append({
            "event_datetime": dt.isoformat() if dt else None,
            "country_code": r_dict["country_code"],
            "indicator_name": r_dict["indicator_name"],
            "actual_value": r_dict["actual_value"],
            "forecast_value": r_dict["forecast_value"],
            "previous_value": r_dict["previous_value"],
            "status": r_dict.get("status"),      # dict なので get が使える
            "importance": r_dict.get("importance")
        })

    return {
        "date": target_date.isoformat(),
        "weekday": target_date.strftime("%A"),
        "events": events
    }



# --------------------------
# 週間単位の経済カレンダー
# --------------------------
@app.get("/economic-calendar/week")
async def get_economic_calendar_week(date: str = Query(None, description="基準日 (YYYY-MM-DD)")):
    JST = pytz.timezone("Asia/Tokyo")
    try:
        base_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now(JST).date()
    except Exception:
        raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")

    # 月曜始まりで週の範囲を決定
    start_of_week = base_date - timedelta(days=base_date.weekday())  # 月曜
    end_of_week = start_of_week + timedelta(days=4)  # 金曜まで表示（平日想定）

    query = """
        SELECT event_datetime, country_code, indicator_name,
               actual_value, forecast_value, previous_value,
               status, importance
        FROM economic_calendar
        WHERE DATE(event_datetime) BETWEEN :start_date AND :end_date
        ORDER BY event_datetime ASC
    """
    try:
        rows = await database.fetch_all(query=query, values={"start_date": start_of_week, "end_date": end_of_week})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # データを曜日ごとにまとめる
    days_map = {i: [] for i in range(5)}  # 月〜金のみ
    for r in rows:
        dt = r["event_datetime"]
        if not dt:
            continue
        weekday = dt.weekday()
        if weekday < 5:  # 月〜金のみ
            days_map[weekday].append({
                "event_datetime": dt.isoformat(),
                "country_code": r["country_code"],
                "indicator_name": r["indicator_name"],
                "actual_value": r["actual_value"],
                "forecast_value": r["forecast_value"],
                "previous_value": r["previous_value"],
                "status": r["status"],
                "importance": r["importance"]
            })

    week_data = []
    for i in range(5):
        day_date = start_of_week + timedelta(days=i)
        week_data.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "weekday": day_date.strftime("%a"),  # Mon, Tue,...
            "events": days_map[i]
        })

    return {
        "week_start": start_of_week.strftime("%Y-%m-%d"),
        "week_end": end_of_week.strftime("%Y-%m-%d"),
        "days": week_data
    }


@app.get("/economic-calendar/month")
async def get_monthly_calendar(year: int = Query(...), month: int = Query(...)):
    """
    月間経済カレンダーを取得（重要度 HIGH の指標のみ）
    """
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    # 重要度 HIGH のみを取得
    query = """
        SELECT event_datetime, indicator_name, importance
        FROM economic_calendar
        WHERE DATE(event_datetime) BETWEEN :start_date AND :end_date
          AND importance = 'HIGH'
        ORDER BY event_datetime ASC
    """
    rows = await database.fetch_all(query=query, values={"start_date": start_date, "end_date": end_date})

    # 日付ごとにまとめる
    day_map: Dict[str, List[Dict]] = {}
    for r in rows:
        dt: datetime = r["event_datetime"]
        day_str = dt.date().isoformat()
        if day_str not in day_map:
            day_map[day_str] = []
        day_map[day_str].append({
            "event": r["indicator_name"],
            "time": dt.strftime("%H:%M"),
            "importance": r["importance"]
        })

    # 月間データを作成
    weeks = []
    current_week = []

    # 月初の前日（前月末）から埋める
    first_day = date(year, month, 1)
    first_weekday = first_day.weekday()  # 月曜=0
    for i in range(first_weekday):
        prev_date = first_day - timedelta(days=first_weekday - i)
        current_week.append({
            "date": prev_date.isoformat(),
            "events": day_map.get(prev_date.isoformat(), []),
            "isCurrentMonth": False
        })

    # 当月の日付を追加
    for d in range(1, last_day + 1):
        current_date = date(year, month, d)
        current_week.append({
            "date": current_date.isoformat(),
            "events": day_map.get(current_date.isoformat(), []),
            "isCurrentMonth": True
        })
        if len(current_week) == 7:
            weeks.append(current_week)
            current_week = []

    # 月末の残り日を次月で埋める
    next_day = 1
    while len(current_week) > 0 and len(current_week) < 7:
        next_date = date(year, month, last_day) + timedelta(days=next_day)
        current_week.append({
            "date": next_date.isoformat(),
            "events": day_map.get(next_date.isoformat(), []),
            "isCurrentMonth": False
        })
        next_day += 1
    if current_week:
        weeks.append(current_week)

    return {"weeks": weeks}