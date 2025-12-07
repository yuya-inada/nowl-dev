import React, { useEffect, useState } from "react";
import axios from "axios";

const MarketDataLogs = () => {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("latest"); // latest or info
  const [loading, setLoading] = useState(false);

  // 🔹 ここを追加：マウント時にスクロールトップへ
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" }); // "smooth" でもOK
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url =
        activeTab === "latest"
          ? "http://localhost:8081/api/market-data-logs/latest?limit=50"
          : "http://localhost:8081/api/market-data-logs/info?limit=50";
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (e) {
      console.error("ログ取得失敗:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const toJST = (utcString) => {
    if (!utcString) return "-";
    const utcDate = new Date(utcString);
    return utcDate.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  };

  return (
    <div className="pt-10 p-2">
      <div className="bg-[#2B2B2B] text-[#D4B08C] rounded-2xl shadow-xl w-full max-w-[98%] mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center border-b border-[#4A4A4A] p-4">
          <h2 className="text-lg font-bold">Financial Market Data Acquisition Log</h2>
        </div>

        {/* タブ */}
        <div className="flex w-full border-b border-[#4A4A4A]">
          <button
            className={`px-4 py-2 ${activeTab === "latest" ? "border-b-2 border-[#D4B08C] font-bold" : ""}`}
            onClick={() => setActiveTab("latest")}
          >
            Latest
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "info" ? "border-b-2 border-[#D4B08C] font-bold" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Progress (INFO)
          </button>
        </div>

        {/* テーブル */}
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center text-[#8A7A6A]">読み込み中...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-[#8A7A6A]">データが存在しません</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#3A3A3A]">
                <tr>
                  <th className="px-2 py-1 text-center">Log id</th>
                  <th className="px-2 py-1 text-center">Market</th>
                  <th className="px-2 py-1 text-center">Market Data</th>
                  <th className="px-2 py-1 text-center">Status</th>
                  {activeTab === "latest" && <th className="px-2 py-1 text-center">Number of cases</th>}
                  <th className="px-2 py-1 text-center">Process ID</th>
                  <th className="px-2 py-1 text-center">Progress (%)</th>
                  <th className="px-2 py-1 text-center">Start</th>
                  <th className="px-2 py-1 text-center">End</th>
                  <th className="px-2 py-1 text-center">Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-b border-[#4A4A4A] hover:bg-[#444]">
                    <td className="px-2 py-1 text-center">{log.id}</td>
                    <td className="px-2 py-1 text-center">{log.market_name}</td>
                    <td className="px-2 py-1 text-center">{toJST(log.market_datatime)}</td>
                    <td className={`font-semibold ${
                        log.status === "SUCCESS" ? "text-green-400" :
                        log.status === "FAILED" ? "text-red-400" :
                        log.status === "INFO" ? "text-yellow-300" : "text-gray-300"
                    }`}>{log.status}</td>
                    {activeTab === "latest" && <td className="px-2 py-1 text-center">{log.data_count ?? "-"}</td>}
                    <td className="px-2 py-1 text-center">{log.process_id ?? "-"}</td>
                    <td className="px-2 py-1 text-center">{log.progress ?? "-"}</td>
                    <td className="px-2 py-1 text-center">{toJST(log.fetch_start)}</td>
                    <td className="px-2 py-1 text-center">{toJST(log.fetch_end)}</td>
                    <td className="px-2 py-1 text-center">{log.error_message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDataLogs;