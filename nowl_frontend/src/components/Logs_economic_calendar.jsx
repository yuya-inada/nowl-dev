import React, { useState, useEffect } from "react";

const LogsEconomicCalendar = () => {
  const [logs, setLogs] = useState([]);

  // 🔹 ここを追加：マウント時にスクロールトップへ
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" }); // "smooth" でもOK
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`http://localhost:8081/api/event-sync-logs?limit=50`);
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 mt-5">
      <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide mb-2">ECONOMIC CALENDAR LOGS</h2>
      {logs.length === 0 ? (
        <div className="text-[#8A7A6A] text-center py-4">No logs available.</div>
      ) : (
        <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4">
          {logs.length === 0 ? (
            <div className="text-[#8A7A6A] text-center py-4">No logs available.</div>
          ) : (
            <div className="h-[500px] overflow-y-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-[#3A3A3A] text-[#D4B08C]">
                    <th className="border border-[#4A4A4A] px-2 py-1 text-left">Time</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-left">Action</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-left">Status</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={idx} className="bg-[#3A3A3A] text-[#D4B08C]">
                      <td className="border border-[#4A4A4A] px-2 py-1">
                        {new Date(log.executed_at).toLocaleString()}
                      </td>
                      <td className="border border-[#4A4A4A] px-2 py-1">{log.action}</td>
                      <td className="border border-[#4A4A4A] px-2 py-1">{log.status}</td>
                      <td className="border border-[#4A4A4A] px-2 py-1">{log.error_message || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogsEconomicCalendar;