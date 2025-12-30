// src/api/supply_logs.js
export async function fetchLogs(limit = 100) {
  const res = await fetch(`http://localhost:8090/logs/?limit=${limit}`);
  if (!res.ok) {
    throw new Error("ログ取得に失敗しました");
  }
  return res.json();
}