# Python公式イメージ（軽量版）
FROM python:3.11-slim

# 作業ディレクトリ
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt .

# 依存関係インストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# コンテナ起動時のコマンド
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]