import React, { useState, useEffect } from "react";

const LogsEconomicCalendar = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    fetch(`http://localhost:8081/api/event-sync-logs?limit=50`)
      .then(res => res.json())
      .then(setLogs)
      .catch(() => setLogs([]));
  }, []);

  const STATUS_STYLE = {
    success: "bg-green-900 text-green-300",
    SUCCESS: "bg-green-900 text-green-300",
    error: "bg-red-900 text-red-300",
    warning: "bg-yellow-900 text-yellow-300",
    INFO: "bg-blue-900 text-blue-300",
  };

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 mt-5">
      <h2 className="text-sm font-bold text-[#D4B08C] mb-3">
        ECONOMIC CALENDAR LOGS
      </h2>

      <div className="h-[520px] overflow-y-auto">
        <table className="min-w-full border-collapse text-sm leading-relaxed">
          <thead>
            <tr className="bg-[#3A3A3A] text-[#D4B08C]">
              <th className="border border-[#4A4A4A] px-2 py-1 text-xl text-center w-[160px]">Time</th>
              <th className="border border-[#4A4A4A] px-2 py-1 text-xl text-center w-[220px]">Action</th>
              <th className="border border-[#4A4A4A] px-2 py-1 text-xl text-center w-[90px]">Status</th>
              <th className="border border-[#4A4A4A] px-2 py-1 text-xl text-center w-[50%]">Message</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, idx) => {
              const lines = (log.action_detail || "").split("\n").filter(Boolean);
              const summary = lines[0];
              const details = lines.slice(1);

              return (
                <tr
                  key={idx}
                  className="bg-[#2F2F2F] text-[#D4B08C] align-middle"
                >
                  <td className="border border-[#4A4A4A] px-2 py-1 whitespace-nowrap">
                    {new Date(log.executed_at).toLocaleString()}
                  </td>

                  <td className="border border-[#4A4A4A] px-2 py-1">
                    <div className="font-semibold">{log.action}</div>
                    {summary && (
                      <div className="text-xs mt-1 text-green-400">
                        {summary}
                      </div>
                    )}
                  </td>

                  <td className="border border-[#4A4A4A] px-2 py-1 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        STATUS_STYLE[log.status] ||
                        "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className="border border-[#4A4A4A] px-2 py-1">
                    {details.length > 0 && (
                      <ul className="text-xs text-[#9A8F80] space-y-0.5">
                        {details.map((line, i) => (
                          <li key={i}>• {line}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsEconomicCalendar;