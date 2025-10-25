// src/components/EconomicEventsList.tsx
import React, { useEffect, useState } from "react";
import { fetchEconomicEvents, EconomicEvent } from "../api/economicEvents";

export const EconomicEventsList = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selected, setSelected] = useState<EconomicEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"statement" | "press" | "projection">("statement");

  useEffect(() => {
    fetchEconomicEvents().then(setEvents).catch(console.error);
  }, []);

  return (
    <div className="bg-[#2A2A2A] p-4 rounded-lg space-y-4">
      <h2 className="text-xl font-bold">金融イベント</h2>

      <div className="flex gap-4">
        {/* 左：イベントリスト */}
        <ul className="w-1/3 overflow-y-auto max-h-[400px] border-r border-[#555] pr-2">
          {events.map((e) => (
            <li
              key={e.event_date + e.event_name}
              className={`p-2 cursor-pointer rounded ${
                selected === e ? "bg-[#444]" : "hover:bg-[#333]"
              }`}
              onClick={() => {
                setSelected(e);
                setActiveTab("statement");
              }}
            >
              <div>{e.event_date}</div>
              <div className="font-semibold">{e.event_name}</div>
            </li>
          ))}
        </ul>

        {/* 右：選択イベント詳細 */}
        <div className="w-2/3 p-2">
          {selected ? (
            <div className="bg-[#1F1F1F] p-4 rounded-lg shadow-md space-y-4">
              {/* ヘッダー */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{selected.event_name}</h3>
                <span className="text-sm text-[#AAAAAA]">{selected.event_date}</span>
              </div>
              <p className="text-sm text-[#AAAAAA]">国: {selected.country_code}</p>

              {/* タブボタン */}
              <div className="flex gap-2 mt-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "statement" ? "bg-[#D4B08C] text-[#1C1C1C]" : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("statement")}
                >
                  Statement
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "press" ? "bg-[#8CC4D4] text-[#1C1C1C]" : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("press")}
                  disabled={!selected.press_conf_url}
                >
                  Press Conference
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "projection" ? "bg-[#A3D48D] text-[#1C1C1C]" : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("projection")}
                  disabled={!selected.projection_pdf_url}
                >
                  Projection
                </button>
              </div>

              {/* タブ内容 */}
              <div className="mt-2 p-2 bg-[#2A2A2A] rounded max-h-[300px] overflow-y-auto text-sm whitespace-pre-wrap">
                {activeTab === "statement" && (selected.text_content || "ステートメントのテキストはありません。")}
                {activeTab === "press" &&
                  (selected.press_conf_url ? (
                    <a
                      href={selected.press_conf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD700] underline"
                    >
                      Press Conference PDF
                    </a>
                  ) : (
                    "Press Conference PDFはありません。"
                  ))}
                {activeTab === "projection" &&
                  (selected.projection_pdf_url ? (
                    <a
                      href={selected.projection_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A3D48D] underline"
                    >
                      Projection PDF
                    </a>
                  ) : (
                    "Projection PDFはありません。"
                  ))}
              </div>

              {/* ステートメントPDFリンク */}
              {selected.statement_pdf_url && (
                <a
                  href={selected.statement_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-3 py-1 bg-[#D4B08C] text-[#1C1C1C] rounded hover:bg-[#e6c88a] text-sm"
                >
                  Statement PDF
                </a>
              )}
            </div>
          ) : (
            <p>イベントを選択してください</p>
          )}
        </div>
      </div>
    </div>
  );
};