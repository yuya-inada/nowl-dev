import React, { useEffect, useState } from "react";

const LogsEconomicEvent = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  useEffect(() => {
    fetch("http://localhost:8081/api/economic-event-logs")
      .then(res => res.json())
      .then(data => {
        console.log("🔥 APIからのデータ:", data);
        // idがユニークなものだけ残す
        const uniqueLogs = Array.from(new Map(data.map(item => [item.id, item])).values());

        setLogs(uniqueLogs);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false); // ←必ずここで false にする
      });
  }, []);

  if (loading)
    return <div className="text-[#8A7A6A] text-center py-4">Loading...</div>;
  if (!logs.length)
    return <div className="text-[#8A7A6A] text-center py-4">ログはありません</div>;

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl shadow-xl p-6 mt-6">
      <h2 className="text-lg font-bold text-[#D4B08C] tracking-wide mb-4">
        ECONOMIC EVENT LOGS
      </h2>

      <div className="h-[500px] overflow-y-auto">
        <table className="min-w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-[#3A3A3A] text-[#D4B08C] uppercase text-lg">
              <th className="border border-[#4A4A4A] px-3 py-2 text-center">Event Date</th>
              <th className="border border-[#4A4A4A] px-3 py-2 text-center">Log Date</th>
              <th className="border border-[#4A4A4A] px-3 py-2 text-center">Event Name</th>
              <th className="border border-[#4A4A4A] px-3 py-2 text-center">Status</th>
              <th className="border border-[#4A4A4A] px-3 py-2 text-center">Note</th>
            </tr>
          </thead>
          <tbody>
            {logs
              .filter(log => log.status !== "PENDING") // ← PENDING を除外
              .map((log, idx) => (
                <tr
                  key={idx}
                  className={`bg-[#3A3A3A] text-[#D4B08C] ${
                    idx % 2 === 0 ? "even:bg-[#2A2A2A]" : ""
                  }`}
                >
                  <td className="border border-[#4A4A4A] px-3 py-2">
                    {formatDate(log.event_datetime)}
                  </td>
                  <td className="border border-[#4A4A4A] px-3 py-2">
                    {formatDate(log.log_time)}
                  </td>
                  <td className="border border-[#4A4A4A] px-3 py-2">{log.event_name || "-"}</td>
                  <td className="border border-[#4A4A4A] px-3 py-2">{log.status || "-"}</td>
                  <td className="border border-[#4A4A4A] px-3 py-2 break-all text-left">{log.error_message || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsEconomicEvent;