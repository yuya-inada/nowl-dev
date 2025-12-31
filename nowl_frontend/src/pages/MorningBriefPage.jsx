import React, { useEffect, useState } from "react";

export default function MorningBriefPage({ currentUser }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState(null);

  // 画面上部を表示
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8091/api/morning-brief/latest")
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(data => setBrief(data))
      .catch(err => {
        console.error(err);
        setError("Failed to load Morning Brief");
      });
  }, []);

  // Brief log
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    fetch("http://localhost:8081/analysis/morning-brief")
      .then(res => res.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

  // パフォーマンス
  const [performance, setPerformance] = useState(null);
  useEffect(() => {
    fetch("http://localhost:8081/analysis/ai-performance")
      .then(res => res.json())
      .then(setPerformance)
      .catch(console.error);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-red-400 p-6">
        {error}
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] p-6">
        Loading Morning Brief...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] p-6">
      <h1 className="text-2xl font-bold mb-4">🦉 Morning Brief Control Panel</h1>

      <div className="mb-4 text-sm text-[#9A8F80]">
        Logged in as {currentUser.username} ({currentUser.role})
      </div>

      {/* Morning Brief */}
      <div className="border border-[#3A3A3A] rounded p-6 mb-6 bg-[#151515] text-left">
        <div className="text-lg font-bold mb-3 leading-relaxed text-[#F0D9B5] space-y-1">
          {(brief.headline || "")
            .split("。")
            .filter(s => s.trim() !== "")
            .map((sentence, i) => (
              <div key={i}>{sentence}。</div>
            ))}
        </div>
        <div className="text-sm mb-3 text-[#9A8F80]">
          📊 {brief.indexes}
        </div>

        <ul className="space-y-1 mb-4 pl-4 text-sm">
          {brief.drivers?.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>

        <div className="mt-3 p-3 rounded bg-[#0F1F16] text-green-400 font-bold">
          🤖 AI Decision: {brief.action}  
          <span className="ml-2 text-sm text-[#9A8F80]">
            confidence {brief.confidence}
          </span>
        </div>

        {brief.aiDecision && (
          <div className="mt-2 text-sm text-blue-400">
            🧭 Tone: {brief.aiDecision.tone} / Continuation: {brief.aiDecision.continuation}
          </div>
        )}
      </div>

      {/* パフォーマンス */}
      {performance && (
        <div className="border border-[#3A3A3A] rounded p-4 mb-6 bg-[#151515]">
          <h2 className="text-xl font-bold mb-2 text-[#D4B08C]">
            🧠 Nowl AI Performance
          </h2>

          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-[#9A8F80] text-xs">Trades</div>
              <div className="text-lg font-bold">{performance.trades}</div>
            </div>

            <div>
              <div className="text-[#9A8F80] text-xs">Wins</div>
              <div className="text-lg font-bold">{performance.wins}</div>
            </div>

            <div>
              <div className="text-[#9A8F80] text-xs">Win Rate</div>
              <div className="text-lg font-bold text-green-400">
                {performance.win_rate}%
              </div>
            </div>

            <div>
              <div className="text-[#9A8F80] text-xs">Total PnL</div>
              <div className={`text-lg font-bold ${performance.total_pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {performance.total_pnl}
              </div>
            </div>

            <div>
              <div className="text-[#9A8F80] text-xs">Avg Return</div>
              <div className="text-lg font-bold">
                {performance.avg_return}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brief log */}
      <h2 className="text-xl font-bold mt-8 mb-2">📜 AI Judgment Log</h2>
      <table className="w-full text-sm border border-[#3A3A3A]">
        <thead>
          <tr className="bg-[#2A2A2A]">
            <th className="p-2">Date</th>
            <th>Action</th>
            <th>Conf</th>
            <th>Size</th>
            <th>Tone</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l, i) => (
            <tr key={i} className="border-t border-[#333]">
              <td className="p-2">{l.date}</td>
              <td>{l.action}</td>
              <td>{l.confidence}</td>
              <td>{l.position_size}</td>
              <td>{l.tone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}