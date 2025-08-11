# ベースイメージ（Node公式イメージ）
FROM node:20 AS build

# 作業ディレクトリ作成
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json ./
COPY package-lock.json* ./ 

# 依存関係インストール
RUN npm install

# ソースコードをコピー
COPY . .

# ビルド（プロダクション用）
RUN npm run build

# ----------------------------------------------------

# 実行用ステージ（軽量なnginxイメージを利用）
FROM nginx:stable-alpine

# ビルド成果物をnginxの公開ディレクトリにコピー
COPY --from=build /app/dist /usr/share/nginx/html

# ポート解放
EXPOSE 80

# nginx起動コマンド（デフォルトで実行される）
CMD ["nginx", "-g", "daemon off;"]