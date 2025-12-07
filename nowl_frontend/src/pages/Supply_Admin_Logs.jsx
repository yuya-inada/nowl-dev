import React, { useEffect, useState } from "react";
import { fetchLogs } from "../api/supply_logs";

export default function SupplyAdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all | boj | impact
  const [impactSummary, setImpactSummary] = useState(null);
  const [interventionSummary, setInterventionSummary] = useState(null);

  // 🔹 ここを追加：マウント時にスクロールトップへ
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" }); // "smooth" でもOK
  }, []);

  useEffect(() => {
    fetch("http://localhost:8090/api/supply/boj-etf-impact/latest")
      .then(res => res.json())
      .then(setImpactSummary)
      .catch(() => setImpactSummary(null));
  }, []);

  // 👇 Intervention Index（構造的な介入度）を取得
  useEffect(() => {
    fetch("http://localhost:8090/api/supply/boj-intervention/latest")
      .then(res => res.json())
      .then(setInterventionSummary)
      .catch(() => setInterventionSummary(null));
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (activeTab === "all") return true;
    if (activeTab === "boj") return log.indicator_name?.startsWith("boj_");
    if (activeTab === "impact") return log.indicator_name === "boj_etf_impact_index";
    return true;
  });

  const impactLogs = logs
  .filter((l) => l.indicator_name === "boj_etf_impact_index")
  .sort(
    (a, b) =>
      new Date(b.observation_date) - new Date(a.observation_date)
  );
  const latestImpact = impactLogs[0];

  const meta =
    latestImpact && latestImpact.values_json
      ? typeof latestImpact.values_json === "string"
        ? JSON.parse(latestImpact.values_json)
        : latestImpact.values_json
      : null;

  useEffect(() => {
    fetchLogs()
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="text-[#8A7A6A] text-center py-4">Loading...</div>;

  return (
    <>
      {/* ====================== PDF モーダル ====================== */}
      {pdfUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#2A2A2A] w-[85vw] h-[90vh] rounded-lg shadow-xl border border-[#555] relative flex flex-col">

            {/* Closeボタン */}
            <button
              onClick={() => setPdfUrl(null)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 rounded"
            >
              ✕ CLOSE
            </button>

            {/* PDF埋め込みプレビュー → 今は直接URL表示 */}
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-b-lg"
              title="PDF Preview"
            />
          </div>
        </div>
      )}

      {/* ====================== LOG TABLE ====================== */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 mt-5">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide mb-2">
          SUPPLY / DEMAND LOGS
        </h2>
        <div className="flex justify-center gap-2 mb-4">
          <TabButton
            label="🔍 All Logs"
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <TabButton
            label="🏦 BOJ ETF Only"
            active={activeTab === "boj"}
            onClick={() => setActiveTab("boj")}
          />
          <TabButton
            label="🧠 Impact Index"
            active={activeTab === "impact"}
            onClick={() => setActiveTab("impact")}
          />
        </div>

        {activeTab === "impact" && impactSummary && (
          <div className="mb-4 p-4 rounded border border-[#3A3A3A] bg-[#1F1F1F]">
            <div className="text-xs text-[#8A7A6A] mb-1">
              BOJ ETF Impact Summary
            </div>

            {/* ✅ 追加：観測日 */}
            <div className="text-[11px] text-[#9A8F80] mb-3">
              Evaluation Date:{" "}
              <span className="text-[#D4B08C] font-semibold">
                {impactSummary.observation_date}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-[#8A7A6A]">Impact</div>
                <div className="text-2xl font-bold text-[#D4B08C]">
                  {(impactSummary.impact * 100).toFixed(2)}%
                </div>
              </div>

              <div>
                <div className="text-xs text-[#8A7A6A]">Level</div>
                <div className="text-sm font-bold text-[#E3D1B0]">
                  {impactSummary.level_label ?? "-"}
                </div>
              </div>

              <div className="flex-1">
                <div className="text-xs text-[#8A7A6A]">Interpretation</div>
                <div className="text-sm text-[#CDB59B]">
                  {impactSummary.interpretation_ja ?? "-"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 👇 ここから BOJ Intervention Index のカード */}
        {activeTab === "impact" && interventionSummary && (
          <div className="mb-4 p-4 rounded border border-[#3A3A3A] bg-[#181818]">
            <div className="text-xs text-[#8A7A6A] mb-1">
              BOJ Structural Intervention Index
            </div>

            <div className="text-[11px] text-[#9A8F80] mb-3">
              Balance Sheet Date:{" "}
              <span className="text-[#D4B08C] font-semibold">
                {interventionSummary.observation_date}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-[#8A7A6A]">Intervention Share</div>
                <div className="text-xl font-bold text-[#E3C088]">
                  {(interventionSummary.value * 100).toFixed(1)}%
                </div>
              </div>

            <div className="flex-1 text-sm text-[#CDB59B]">
              {interventionSummary.interpretation_ja ??
                "日銀バランスシートにおける市場介入的資産の比率。値が高いほど、相場が官製化している状態。"}
            </div>
          </div>
        </div>
        )}

        {filteredLogs.length === 0 ? (
            <div className="text-[#8A7A6A] text-center py-4">
              No logs available.
            </div>
          ) : (
            <div className="h-[550px] overflow-y-auto bg-[#2A2A2A] border border-[#3A3A3A] rounded p-2 shadow-inner">
              <table className="min-w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-[#3A3A3A] text-[#D4B08C]">
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">ID</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">Index</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">Date</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">Status</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">Values(JSON)</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">PDF</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">Message</th>
                    <th className="border border-[#4A4A4A] px-2 py-1 text-center">Fetched</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="bg-[#3A3A3A] text-[#E3D1B0] hover:bg-[#444] text-xs"
                    >
                    <td className="border border-[#4A4A4A] px-2 py-1 text-center">{log.id}</td>
                    <td className="border border-[#4A4A4A] px-2 py-1 text-center">{log.indicator_name}</td>
                    <td className="border border-[#4A4A4A] px-2 py-1 text-center">{log.observation_date ?? "-"}</td>

                    <td
                      className="border border-[#4A4A4A] px-2 py-1 text-center font-bold"
                      style={{ color: log.status === "success" ? "#4CAF50" : "#FF6B6B" }}
                    >
                      {log.status}
                    </td>

                    {/* JSON値 */}
                    <td className="border border-[#4A4A4A] px-2 py-1 text-left">
                      <pre className="text-xs text-[#CDB59B] whitespace-pre-wrap leading-tight">
                        {log.values_json ? JSON.stringify(log.values_json, null, 2) : "-"}
                      </pre>
                    </td>

                    {/* PDFプレビュー */}
                    <td className="border border-[#4A4A4A] px-2 py-1 text-center">
                      {(() => {
                        const src = log.source_url;
                        if (!src) return "-";

                        // 1) JSON っぽかったら parse を試す
                        if (typeof src === "string" && src.trim().startsWith("{")) {
                          try {
                            const parsed = JSON.parse(src);

                            // 新旧両方のキーに対応
                            const futuresUrl = parsed.futures_url || parsed.futures;
                            const cashUrl    = parsed.cash_url    || parsed.cash;

                            const makeProxy = (url) =>
                              `http://localhost:8090/api/pdf-proxy?url=${encodeURIComponent(url)}`;

                            return (
                              <div className="flex flex-col gap-1">
                                {futuresUrl && (
                                  <button
                                    onClick={() => setPdfUrl(makeProxy(futuresUrl))}
                                    className="text-[#D4B08C] underline hover:text-blue-300 font-bold block"
                                  >
                                    📄 Futures PDF
                                  </button>
                                )}
                                {cashUrl && (
                                  <button
                                    onClick={() => setPdfUrl(makeProxy(cashUrl))}
                                    className="text-[#D4B08C] underline hover:text-blue-300 font-bold block"
                                  >
                                    🧾 Cash PDF
                                  </button>
                                )}
                                {!futuresUrl && !cashUrl && "-"}
                              </div>
                            );
                          } catch (e) {
                            // JSONパース失敗 → 下の「プレーンURL扱い」にフォールバック
                          }
                        }

                        // 2) プレーンURLだった昔のログ用
                        if (typeof src === "string" && src.startsWith("http")) {
                          const proxyUrl =
                            `http://localhost:8090/api/pdf-proxy?url=${encodeURIComponent(src)}`;
                          return (
                            <button
                              onClick={() => setPdfUrl(proxyUrl)}
                              className="text-[#D4B08C] underline hover:text-blue-300 font-bold"
                            >
                              🔗 VIEW
                            </button>
                          );
                        }

                        // 3) それ以外は表示なし
                        return "-";
                      })()}
                    </td>
                    <td className="border border-[#4A4A4A] px-2 py-1 text-center">{log.message ?? ""}</td>
                    <td className="border border-[#4A4A4A] px-2 py-1 text-center">
                      {new Date(log.fetched_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}


// タブボタン
function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded transition
        ${
          active
            ? "bg-[#D4B08C] text-[#2A2A2A] font-bold"
            : "bg-[#3A3A3A] text-[#CDB59B] hover:bg-[#4A4A4A]"
        }`}
    >
      {label}
    </button>
  );
}