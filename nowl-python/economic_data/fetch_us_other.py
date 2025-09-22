# fetch_us_other.py

# ADPEMP　　　　　　　　　：米国ADP雇用統計
# CONF_INDEX　：米国消費者信頼感指数		
# ISM_MAN　　　　　　　：米国ISM製造業景況指数		
# PHILMAN　　　　　　　：米国フィラデルフィア連銀製造業指数		

import pandas as pd
from datetime import datetime
from save_to_db import save_indicator_to_db
import psycopg2

DB_PARAMS = {
    "host": "localhost",
    "port": 5432,
    "dbname": "nowldb",
    "user": "inadayuuya",
    "password": "postgres",
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
            # CSVファイルを読み込み
            csv_path = "/Users/inadayuuya/nowl-dev/nowl-python/economic_data/data/bos_dif.csv"
            df = pd.read_csv(csv_path)

            # 日付整形と総合指数（GAC）抽出
            df['date'] = pd.to_datetime(df['DATE'], format='%b-%y', errors='coerce')

            # 1900年を超えるものは補正
            df['date'] = df['date'].apply(lambda x: x.replace(year=x.year-100) if x.year > datetime.today().year else x)

            # 総合指数だけ抽出して保存用に
            df_to_save = df[['date', 'GAC']].rename(columns={'GAC': 'actual_value'})
        else:
            # それ以外はダミー例
            df_to_save = pd.DataFrame([
                {"date": datetime(2025, 1, 1).date(), "actual_value": 100},
                {"date": datetime(2025, 2, 1).date(), "actual_value": 110},
            ])

        for _, row in df_to_save.iterrows():
            save_indicator_to_db(
                date=row['date'].date() if isinstance(row['date'], pd.Timestamp) else row['date'],
                country_code=series['country_code'],
                country_name=series['country_name'],
                indicator_name=series['indicator_name'],
                actual_value=row['actual_value'],
                unit=series.get('unit', '')
            )
        print(f"{series['indicator_name']} 保存完了")

    except Exception as e:
        print(f"{series['indicator_name']} 取得エラー（スキップ）: {e}")


if __name__ == "__main__":
    master_list = get_other_master_list()
    for series in master_list:
        fetch_and_save(series)