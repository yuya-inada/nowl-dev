// src/pages/NowlAiAnalysis.jsx
import React, { useEffect, useState } from "react";

export default function NowlAiAnalysis() {
  const [templates, setTemplates] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [promptPreview, setPromptPreview] = useState(null);
  const [previewActive, setPreviewActive] = useState(null);
  const [previewSelected, setPreviewSelected] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const [promptLogs, setPromptLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [llmOutputId, setLlmOutputId] = useState(null);
  const [llmReviews, setLlmReviews] = useState([]);
  const [llmRan, setLlmRan] = useState(false);

  const runPreviewByTemplate = async (templateId, setter) => {
    const res = await fetch(
      "http://localhost:8090/api/ai/market-commentary/prompt-preview/by-template",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          symbol: "NIKKEI225",
          date: "latest",
          lookback: 5,
        }),
      }
    );
  
    const json = await res.json();
    setter(json);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8081/api/ai/prompt-templates")
      .then(res => res.json())
      .then(data => {
        const sorted = [...(data || [])].sort((a, b) => {
          if (a.status === "active") return -1;
          if (b.status === "active") return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      
        setTemplates(sorted);
        setSelectedPrompt(sorted.find(t => t.status === "active") ?? sorted[0] ?? null);
      })
      .catch(() => setError("プロンプトテンプレートの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(
      `http://localhost:8090/api/ai/market-commentary/summary?symbol=NIKKEI225&date=${today}&lookback=5`
    )
      .then(res => res.json())
      .then(setAiSummary)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("http://localhost:8090/api/ai/prompt-previews/with-score?limit=10")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPromptLogs(data);
        } else {
          console.error("Unexpected response:", data);
          setPromptLogs([]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedLog) return;
  
    fetch(`http://localhost:8090/api/ai/prompt-previews/${selectedLog.id}`)
      .then(res => res.json())
      .then(setPromptPreview)
      .catch(console.error);
  }, [selectedLog]);

  useEffect(() => {
    if (!llmOutputId) return;
  
    fetch(`http://localhost:8090/api/ai/llm-outputs/${llmOutputId}/reviews`)
      .then(res => res.json())
      .then(setLlmReviews)
      .catch(console.error);
  }, [llmOutputId]);

  const scoreColor = (score) => {
    if (score >= 4.0) return "bg-green-600";
    if (score >= 3.0) return "bg-yellow-500";
    return "bg-red-600";
  };

  const runLlm = async (previewId) => {
    const res = await fetch(
      `http://localhost:8090/api/ai/prompt-previews/${previewId}/run-llm`,
      { method: "POST" }
    );
  
    const json = await res.json();
    setLlmOutputId(json.llm_output_id);
    setLlmRan(true);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] px-4 py-6">
        <div className="text-sm text-[#9A8F80]">Loading AI console...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] px-4 py-6">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] px-4 py-6">
      <h1 className="text-xl font-bold mb-2">NOWL AI - Analysis Console</h1>
      <p className="text-sm text-[#9A8F80] mb-6">
        Nowl が参照する市場データ・需給・イベントから、
        どのように「AIコメント」を生成するかを設計・検証するための管理画面です。
      </p>

      <div className="grid grid-cols-12 gap-4">
        {/* ================= LEFT ================= */}
        <div className="col-span-4 bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4">
          <h2 className="text-sm font-semibold mb-3">プロンプトテンプレート</h2>
          <p className="text-xs text-[#9A8F80] mb-3">
            「市場解説」「需給コメント」「イベント解説」など、
            利用するプロンプトをここで管理（現状は閲覧のみ）。
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {templates.map((tpl) => {
              const isActive = tpl.status === "active";
              const isSelected = selectedPrompt?.id === tpl.id;

              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedPrompt(tpl)}
                  className={`w-full text-left text-xs p-2 rounded border ${
                    isActive
                      ? "border-green-400 bg-[#203020]"
                      : isSelected
                      ? "border-[#D4B08C] bg-[#3A2A1A]"
                      : "border-[#3A3A3A] bg-[#2A2A2A] hover:bg-[#343434]"
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{tpl.name}</span>
                    <span className="text-[10px] text-[#9A8F80] flex items-center gap-1">
                      {tpl.version || "v1"}
                      {isActive ? (
                        <span className="px-1.5 py-0.5 rounded bg-green-700 text-green-200 font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[#9A8F80]">draft</span>
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#CDB59B]">
                    {tpl.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= CENTER ================= */}
        <div className="col-span-5 space-y-6">
          {/* ===== AI INPUT / REVIEW ===== */}
          <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4">
            {aiSummary && (
              <>
                <div className="space-y-3 mb-3 text-sm border border-[#3A3A3A] rounded p-2">
                  <h3 className="text-lg font-bold">{aiSummary.headline}</h3>
                  <p className="text-xs text-[#9A8F80]">
                    {aiSummary.market_name} / {aiSummary.as_of}
                  </p>
                  <p>{aiSummary.overview}</p>
                  <p>{aiSummary.price_insight}</p>
                  <p>{aiSummary.flow_insight}</p>

                  {aiSummary.policy_support_insight && (
                    <div>
                      <span className="font-semibold">Policy / Public Support</span>
                      <p>{aiSummary.policy_support_insight}</p>
                    </div>
                  )}

                  <p>{aiSummary.event_insight}</p>
                </div>
                <div className="mb-4 p-3 border-2 border-green-600 bg-[#102020]">
                  <div className="text-xs font-bold text-green-400 mb-2">
                    ✅ AI INPUT SUMMARY (DEBUG)
                  </div>
                  <pre className="text-xs whitespace-pre-wrap text-[#CDB59B] text-left">
                    {JSON.stringify(aiSummary, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {promptPreview && (
              <div className="mb-3">
                <div className="text-xs font-bold text-[#7FDBCA] mb-2">
                  ✅ PROMPT PREVIEW（LLM INPUT / NO AI CALL）
                </div>
                <pre className="text-xs text-left whitespace-pre-wrap bg-black text-green-300 p-3 rounded max-h-[500px] overflow-y-auto">
                  {promptPreview.rendered_prompt}
                </pre>
              </div>
            )}
            {/* ===== PROMPT DESIGN (STATIC) ===== */}
            {previewActive && previewSelected && (
              <div className="grid grid-cols-2 gap-3 mt-6">
                {/* ACTIVE */}
                <div className="border border-green-500 bg-[#102020] p-3 rounded">
                  <div className="text-xs font-bold text-green-400 mb-2">
                    ACTIVE ({previewActive.template.version})
                  </div>
                  <pre className="text-xs whitespace-pre-wrap text-left text-green-200 max-h-[400px] overflow-y-auto">
                    {previewActive.rendered_prompt}
                  </pre>
                </div>
                {/* SELECTED */}
                <div className="border border-blue-500 bg-[#101820] p-3 rounded">
                  <div className="text-xs font-bold text-blue-400 mb-2">
                    SELECTED ({selectedPrompt?.version})
                  </div>
                  <pre className="text-xs whitespace-pre-wrap text-left text-blue-200 max-h-[400px] overflow-y-auto">
                    {previewSelected?.rendered_prompt}
                  </pre>
                </div>
              </div>
            )}
            {selectedPrompt && (
              <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4 mt-5">
                <h2 className="text-sm font-semibold mb-3">プロンプト詳細（テンプレ）</h2>

                <div className="text-xs mb-3 space-y-1">
                  <div>Name: {selectedPrompt.name}</div>
                  <div>Description: {selectedPrompt.description}</div>
                  <div>
                    Version / Status: {selectedPrompt.version} / {selectedPrompt.status}
                  </div>
                </div>

                <pre className="text-xs text-left text-[#E3D1B0] whitespace-pre-wrap bg-[#262626] p-3 rounded max-h-[300px] overflow-y-auto">
                  {selectedPrompt?.prompt_text}
                </pre>
              </div>
            )}
            <button
              className="mt-3 px-3 py-1.5 text-xs border border-green-400 bg-[#203020]"
              onClick={() => {
                const active = templates.find(t => t.status === "active");
                if (!active || !selectedPrompt) return;

                // =========================
                // ACTIVE → 保存あり
                // =========================
                runPreviewByTemplate(active.id, setPreviewActive);

                // =========================
                // SELECTED → 保存なし（render-only）
                // =========================
                fetch(
                  "http://localhost:8090/api/ai/market-commentary/prompt-preview/render-only",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      template_id: selectedPrompt.id,
                      symbol: "NIKKEI225",
                      date: "latest",
                      lookback: 5,
                    }),
                  }
                )
                  .then(res => res.json())
                  .then((res) => {
                    console.log("SELECTED PREVIEW (readonly)", res);
                    setPreviewSelected(res);
                  })
                  .catch(console.error);
              }}
            >
              このプロンプトで検証
            </button>
            {promptPreview && (
              <div className="mt-6 border border-[#3A3A3A] bg-black p-3 rounded">
                <div className="text-xs font-bold text-[#7FDBCA] mb-2">
                  📄 PROMPT LOG DETAIL
                </div>

                <div className="text-[10px] text-[#9A8F80] mb-2">
                  {promptPreview.template_name} / {promptPreview.template_version}
                  {" · "}
                  {promptPreview.variant}
                </div>

                <pre className="text-xs whitespace-pre-wrap text-green-300 max-h-[400px] overflow-y-auto">
                  {promptPreview.rendered_prompt}
                </pre>
              </div>
            )}

            {llmRan && (
              <div className="mt-4 border border-[#3A3A3A] rounded p-3 bg-[#1E1E1E]">
                <div className="text-xs font-bold mb-2 text-[#9A8F80]">
                  🤖 LLM 出力評価（自動）
                </div>

                {llmReviews.length === 0 ? (
                  <div className="text-xs text-[#9A8F80]">
                    評価はまだありません（未評価）
                  </div>
                ) : (
                  llmReviews.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between mb-2"
                    >
                      <div className="text-xs">
                        Reviewer: <span className="font-semibold">{r.reviewer}</span>
                      </div>

                      <div
                        className={`text-xs px-2 py-1 rounded text-white ${scoreColor(r.score)}`}
                      >
                        {r.verdict.toUpperCase()} / {r.score}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {selectedLog && (
              <button
                className="mt-2 px-3 py-1 text-xs bg-blue-600 rounded"
                onClick={() => runLlm(selectedLog.id)}
              >
                🤖 LLM実行
              </button>
            )}
            {llmOutputId && (
              <button
                className="mt-2 px-3 py-1 text-xs bg-purple-600 rounded"
                onClick={async () => {
                  await fetch(
                    `http://localhost:8090/api/ai/llm-outputs/${llmOutputId}/evaluate-rule`,
                    { method: "POST" }
                  );
                  // 再取得
                  const res = await fetch(
                    `http://localhost:8090/api/ai/llm-outputs/${llmOutputId}/reviews`
                  );
                  setLlmReviews(await res.json());
                }}
              >
                🧠 ルール評価を実行
              </button>
            )}
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="col-span-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4">
          <h2 className="text-sm font-semibold mb-3">
            プロンプト実行ログ
          </h2>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {promptLogs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="w-full text-left text-xs p-2 rounded border border-[#3A3A3A] bg-[#262626] hover:bg-[#303030]"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">
                    {log.template_name}
                  </span>

                  {log.score !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded text-white ${
                        scoreColor(log.score)
                      }`}
                    >
                      {log.score}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-[#9A8F80]">
                  {log.target_date} / {log.run_reason}
                </div>

                <div className="text-[10px] text-[#7FDBCA]">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}