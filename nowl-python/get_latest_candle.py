import requests

url = "http://localhost:8080/market-index-candles/latest"
params = {
    "symbol": "NIKKEI225",
    "marketType": "N225"
}

response = requests.get(url, params=params)
print(response.status_code)  # ← 200 か 404 など
print(response.text)         # ← サーバーが返した内容