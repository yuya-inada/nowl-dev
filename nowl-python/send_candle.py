import requests
import json

url = "http://localhost:8080/market-index-candles"

data = {
    "symbol": "NIKKEI225",
    "marketType": "N225",
    "timestamp": "2025-08-30T15:30:00",
    "open": 35000.5,
    "high": 35100.0,
    "low": 34950.0,
    "close": 35050.0,
    "volume": 1200000
}

response = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(data))
print(response.json())