// src/pages/NowlAiAnalysis.jsx
import React, { useEffect, useState } from "react";

export default function NowlAiAnalysis() {
  const [templates, setTemplates] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  // 🔹 ここを追加：マウント時にスクロールトップへ
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" }); // "smooth" でもOK
  }, []);

  // 🔹 プロンプトテンプレ取得
  useEffect(() => {
    fetch("http://localhost:8081/api/ai/prompt-templates")
      .then(res => res.json())
      .then(data => {
        setTemplates(data || []);
        setSelectedPrompt(data?.[0] ?? null);
      })
      .catch(() => setError("プロンプトテンプレートの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  // ✅ AI入力サマリーAPI（必ずここ）
  useEffect(() => {
    console.log("🚀 calling AI summary API");

    fetch(
      "http://localhost:8090/api/ai/market-commentary/summary?symbol=NIKKEI225&date=2025-09-19&lookback=5"
    )
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("✅ AI input summary:", data);
        setAiSummary(data);   // ← ★これが一番大事
      })
      .catch(err => {
        console.error("❌ Failed to fetch AI summary:", err);
      });
  }, []);

  // 👇 Hooks のあとに early return を書く
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] px-4 py-6">
        <div className="text-sm text-[#9A8F80]">Loading AI console...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] px-4 py-6">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] px-4 py-6">
      <h1 className="text-xl font-bold mb-2">NOWL AI - Analysis Console</h1>
      <p className="text-sm text-[#9A8F80] mb-6">
        Nowl が参照する市場データ・需給・イベントから、
        どのように「AIコメント」を生成するかを設計・検証するための管理画面です。
      </p>

      <div className="grid grid-cols-12 gap-4">
        {/* 左：プロンプトテンプレ一覧 */}
        <div className="col-span-4 bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4">
          <h2 className="text-sm font-semibold mb-3">プロンプトテンプレート</h2>
          <p className="text-xs text-[#9A8F80] mb-3">
            「市場解説」「需給コメント」「イベント解説」など、
            利用するプロンプトをここで管理（現状は閲覧のみ）。
          </p>

          {templates.length === 0 ? (
            <div className="text-xs text-[#8A7A6A]">
              登録されているプロンプトがありません。
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {templates.map((tpl) => {
                const isActive = selectedPrompt?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedPrompt(tpl)}
                    className={`w-full text-left text-xs p-2 rounded border ${
                      isActive
                        ? "border-[#D4B08C] bg-[#3A2A1A]"
                        : "border-[#3A3A3A] bg-[#2A2A2A] hover:bg-[#343434]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[#D4B08C]">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] text-[#9A8F80]">
                        {tpl.version || "v1"} / {tpl.status || "draft"}
                      </span>
                    </div>
                    {tpl.description && (
                      <div className="text-[11px] text-[#CDB59B] line-clamp-2">
                        {tpl.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 中央：選択されたプロンプトの詳細 & 本文 */}
        <div className="col-span-5 bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4">
          {aiSummary && (
            <div className="mb-4 p-3 border-2 border-green-600 bg-[#102020] text-left">
              <div className="text-xs font-bold text-green-400 mb-2">
                ✅ AI INPUT SUMMARY (DEBUG)
              </div>
              <pre className="text-xs text-[#CDB59B] whitespace-pre-wrap">
                {JSON.stringify(aiSummary, null, 2)}
              </pre>
            </div>
          )}
          <h2 className="text-sm font-semibold mb-3">プロンプト詳細</h2>

          {!selectedPrompt ? (
            <div className="text-xs text-[#8A7A6A]">
              左のリストからプロンプトを選択してください。
            </div>
          ) : (
            <>
              <div className="mb-3 text-xs space-y-1">
                <div>
                  <span className="font-semibold text-[#D4B08C]">Name: </span>
                  <span>{selectedPrompt.name}</span>
                </div>
                {selectedPrompt.description && (
                  <div>
                    <span className="font-semibold text-[#D4B08C]">
                      Description:{" "}
                    </span>
                    <span>{selectedPrompt.description}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-[#D4B08C]">
                    Version / Status:{" "}
                  </span>
                  <span>
                    {selectedPrompt.version || "v1"} /{" "}
                    {selectedPrompt.status || "draft"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-[#D4B08C]">
                    Confidence:{" "}
                  </span>
                  <span>
                    {selectedPrompt.confidence_score != null
                      ? selectedPrompt.confidence_score.toFixed
                        ? selectedPrompt.confidence_score.toFixed(2)
                        : selectedPrompt.confidence_score
                      : "-"}
                  </span>
                </div>
              </div>

              {/* ✅ AI入力サマリー説明 */}
              <div className="mb-2 text-[11px] text-[#8A7A6A] leading-relaxed">
                今後ここに、このプロンプトで使用される
                <span className="text-[#D4B08C] font-semibold">「AI入力サマリー（価格・需給・イベント）」</span>
                を LLM なしで生成・表示し、内容と精度を人間が確認します。
              </div>

              {/* ✅ プロンプト本文表示 */}
              <div className="bg-[#262626] border border-[#3A3A3A] rounded p-3">
                <div className="text-[11px] text-[#9A8F80] mb-2 tracking-wide">
                  PROMPT TEMPLATE (READ ONLY)
                </div>

                <pre
                  className="
                    text-xs
                    text-left
                    text-[#E3D1B0]
                    whitespace-pre-wrap
                    leading-relaxed
                    font-hiragino-mincho
                    max-h-[380px]
                    overflow-y-auto
                  "
                >
                  {selectedPrompt.prompt_text}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* 右：最新AI出力ログ（まだダミー） */}
        <div className="col-span-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded p-4">
          <h2 className="text-sm font-semibold mb-3">最新AI出力ログ（予定）</h2>
          <p className="text-xs text-[#9A8F80] mb-2">
            将来的に、バッチ実行した「市場コメント」「週次助言」などの
            出力ログをここに並べる想定。
          </p>
          <div className="text-xs text-[#CDB59B]">
            - 2025-12-07 08:00 市場概況コメント（仮）
            <br />
            - 2025-12-06 08:00 週次助言アップデート（仮）
          </div>
        </div>
      </div>
    </div>
  );
}