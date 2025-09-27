# fetch_us_other.py

# ADPEMP　　　　　　　　　：米国ADP雇用統計
# CONF_INDEX　：米国消費者信頼感指数		
# ISM_MAN　　　　　　　：米国ISM製造業景況指数		
# PHILMAN　　　　　　　：米国フィラデルフィア連銀製造業指数		

import pandas as pd
from datetime import datetime
from save_to_db import save_indicator_to_db
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv("/Users/inadayuuya/nowl-dev/.env")  # パスは環境に合わせる

DB_PARAMS = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

def get_other_master_list(country_code="US"):
    """非FRED指標のマスタをDBから取得"""
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT country_code, country_name, series_id, indicator_name,
               unit, frequency, calc_mom, calc_yoy, source
        FROM economic_indicator_master
        WHERE country_code = %s AND source = 'OTHER'
        ORDER BY id
    """, (country_code,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    master_list = []
    for row in rows:
        master_list.append({
            "country_code": row[0],
            "country_name": row[1],
            "series_id": row[2],
            "indicator_name": row[3],
            "unit": row[4],
            "frequency": row[5],
            "calc_mom": row[6],
            "calc_yoy": row[7],
            "source": row[8],
        })
    return master_list

def fetch_and_save(series):
    """各指標の取得処理（APIやCSVなど）"""
    try:
        if series["series_id"] == "PHILMAN":
            # フィラデルフィア連銀製造業指数 CSV
            csv_path = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/data/bos_dif.csv"
            df = pd.read_csv(csv_path)
            df['date'] = pd.to_datetime(df['DATE'], format='%b-%y', errors='coerce')
            df['date'] = df['date'].apply(lambda x: x.replace(year=x.year-100) if x.year > datetime.today().year else x)
            df_to_save = df[['date', 'GAC']].rename(columns={'GAC': 'actual_value'})

        elif series["series_id"] == "ISM_MAN":
            # ISM製造業景況指数 CSV
            csv_path = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/data/ISM-pmi-pm.csv"
            df = pd.read_csv(csv_path)
            df['date'] = pd.to_datetime(df['period'] + '-01')
            df_to_save = df[['date', 'PMI (ISM/pmi/pm)']].rename(columns={'PMI (ISM/pmi/pm)': 'actual_value'})

        elif series["series_id"] == "ADPEMP":
          # ADP雇用統計 Excel
          file_path = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/data/nboshistory.xlsx"
          df = pd.read_excel(file_path)

          # 日付列を datetime 型に変換
          df['date'] = pd.to_datetime(df['date'], format='%b-%y', errors='coerce')

          # 総雇用者数の列を actual_value に変換（例: garbndif_sa）
          df_to_save = df[['date', 'garbndif_sa']].rename(columns={'garbndif_sa': 'actual_value'})

        elif series["series_id"] == "CONF_INDEX":
            # 消費者信頼感指数 CSV　ミシガン大学版（FREDだから）
            csv_path = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/data/UMCSENT.csv"
            df = pd.read_csv(csv_path)

            # 日付列を datetime 型に変換
            df['date'] = pd.to_datetime(df['observation_date'], errors='coerce')

            # NaT を含む行は除外
            df = df.dropna(subset=['date', 'UMCSENT'])

            # 指数値を actual_value に変換
            df_to_save = df[['date', 'UMCSENT']].rename(columns={'UMCSENT': 'actual_value'})

            # indicator_name に (ミシガン大学) を追加
            series['indicator_name'] = f"{series['indicator_name']}（ミシガン大学）"

        # DBに保存（重複チェックあり）
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        saved_any = False  # 保存したかどうかのフラグ
        for _, row in df_to_save.iterrows():
            save_date = row['date'].date() if isinstance(row['date'], pd.Timestamp) else row['date']

            # 重複チェック
            cur.execute("""
                SELECT 1 FROM economic_indicators
                WHERE indicator_name = %s AND date = %s
            """, (series['indicator_name'], save_date))
            if cur.fetchone():
                continue  # 重複はスキップ

            save_indicator_to_db(
                date=save_date,
                country_code=series['country_code'],
                country_name=series['country_name'],
                indicator_name=series['indicator_name'],
                actual_value=row['actual_value'],
                unit=series.get('unit', '')
            )
            saved_any = True

        conn.close()

        if saved_any:
            print(f"{series['indicator_name']} 保存完了")
        else:
            print(f"{series['indicator_name']} すでに存在していたため新規保存なし")

    except Exception as e:
        print(f"{series['indicator_name']} 取得エラー（スキップ）: {e}")

if __name__ == "__main__":
    master_list = get_other_master_list()
    for series in master_list:
        fetch_and_save(series)