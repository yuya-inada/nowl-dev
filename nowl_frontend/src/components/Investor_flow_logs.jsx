import React, { useEffect, useState } from "react";

export default function InvestorFlowLogs() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
      fetch("http://localhost:8081/investor_flow/logs", { credentials: "include" })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => setLogs(data))
        .catch(err => {
          console.error("ログ取得エラー:", err);
          setLogs([]); // 空配列でレンダリング
        });
    }, []);

    return (
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 mt-5">
          <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide mb-2">INVESTOR FLOW LOGS</h2>

          {logs.length === 0 ? (
              <div className="text-[#8A7A6A] text-center py-4">No logs available.</div>
          ) : (
              <div className="h-[500px] overflow-y-auto bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-inner p-2">
                  <table className="min-w-full table-auto border-collapse">
                      <thead>
                          <tr className="bg-[#3A3A3A] text-[#D4B08C]">
                              <th className="border border-[#4A4A4A] px-2 py-1 text-center">Log date</th>
                              <th className="border border-[#4A4A4A] px-2 py-1 text-center">Status</th>
                              <th className="border border-[#4A4A4A] px-2 py-1 text-center">PDF</th>
                              <th className="border border-[#4A4A4A] px-2 py-1 text-center">No extracted tables</th>
                              <th className="border border-[#4A4A4A] px-2 py-1 text-center">Main entity count</th>
                              <th className="border border-[#4A4A4A] px-2 py-1 text-center">Note</th>
                          </tr>
                      </thead>
                      <tbody>
                          {logs.map((log, idx) => (
                              <tr key={idx} className="bg-[#3A3A3A] text-[#D4B08C]">
                                  <td className="border border-[#4A4A4A] px-2 py-1">
                                      {new Date(log.run_at).toLocaleString()}
                                  </td>
                                  <td className="border border-[#4A4A4A] px-2 py-1">{log.status}</td>
                                  <td className="border border-[#4A4A4A] px-2 py-1">
                                      {log.pdf_url ? (
                                          <a href={log.pdf_url} target="_blank" rel="noopener noreferrer" className="underline">
                                              PDF
                                          </a>
                                      ) : (
                                          "-"
                                      )}
                                  </td>
                                  <td className="border border-[#4A4A4A] px-2 py-1">{log.table_count}</td>
                                  <td className="border border-[#4A4A4A] px-2 py-1">{log.record_count}</td>
                                  <td className="border border-[#4A4A4A] px-2 py-1">{log.message || ""}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
  );
}