import React, { useEffect, useRef, useState } from "react";
import { fetchEconomicEvents, EconomicEvent } from "../api/economicEvents";

export const EconomicEventsList = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selected, setSelected] = useState<EconomicEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"statement" | "press" | "projection">("statement");
  const [filter, setFilter] = useState<string>("FOMC");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    fetchEconomicEvents()
      .then((data) => {
        setEvents(data);
      })
      .catch(console.error);
  }, []);

  const filtered = events.filter((e) =>
    e.event_name.toUpperCase().includes(filter.toUpperCase())
  );

  useEffect(() => {
    if (listRef.current && filtered.length) {
      const today = new Date();
      const latestPastIndex = filtered.findIndex(
        (e) => new Date(e.event_date) <= today
      );
      if (latestPastIndex >= 0) {
        const itemHeight = 66;
        listRef.current.scrollTop = Math.max(itemHeight * (latestPastIndex - 2), 0);
      }
    }
  }, [filtered]);

  return (
    <div className="bg-[#2A2A2A] rounded shadow-xl">
      {/* ==== HEADER ==== */}
      <div className="bg-[#3A3A3A] w-full px-4 py-2 border-b border-[#4A4A4A]">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide text-left">
          ECONOMIC EVENTS
        </h2>
      </div>

      {/* ==== BODY ==== */}
      <div className="flex gap-4 h-[580px] p-4">
        {/* 左：イベントリスト */}
        <div className="w-1/3 border-r border-[#555] pr-2 flex flex-col">
          {/* フィルタボタン */}
          <div className="flex flex-wrap gap-2 mb-2">
            {["FOMC", "日銀", "ECB", "ジャクソンホール", "その他"].map((name) => (
              <button
                key={name}
                onClick={() => setFilter(name)}
                className={`px-2 py-1 rounded text-sm transition ${
                  filter === name
                    ? "bg-[#FFD700] text-black"
                    : "bg-[#333] hover:bg-[#444] text-[#CCC]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* イベント一覧 */}
          <ul ref={listRef} className="overflow-y-auto flex-1">
            {filtered.map((e) => {
              const eventDate = new Date(e.event_date);
              const today = new Date();
              const isFuture = eventDate > today;
              const isSelected = selected === e;

              return (
                <li
                  key={e.event_date + e.event_name}
                  className={`p-2 cursor-pointer rounded mb-1 transition ${
                    isSelected ? "bg-[#444]" : "hover:bg-[#333]"
                  } ${isFuture ? "opacity-60" : ""}`}
                  onClick={() => {
                    setSelected(e);
                    setActiveTab("statement");
                  }}
                >
                  <div className="text-sm flex justify-between items-center">
                    <span>{e.event_date}</span>
                    {isFuture && (
                      <span className="text-[#FFD700] text-xs ml-2">Upcoming</span>
                    )}
                  </div>
                  <div className="font-semibold">{e.event_name}</div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 右：選択イベント詳細 */}
        <div className="w-2/3 flex flex-col p-2">
          {selected ? (
            <div className="bg-[#1F1F1F] p-4 rounded-lg shadow-md flex flex-col h-full">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{selected.event_name}</h3>
                <span className="text-sm text-[#AAAAAA]">{selected.event_date}</span>
              </div>
              <p className="text-sm text-[#AAAAAA] mb-2">国: {selected.country_code}</p>

              {/* タブボタン */}
              <div className="flex gap-2 mb-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "statement"
                      ? "bg-[#D4B08C] text-[#1C1C1C]"
                      : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("statement")}
                >
                  Statement
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "press"
                      ? "bg-[#8CC4D4] text-[#1C1C1C]"
                      : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("press")}
                  disabled={!selected.press_conf_url}
                >
                  Press Conference
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "projection"
                      ? "bg-[#A3D48D] text-[#1C1C1C]"
                      : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("projection")}
                  disabled={!selected.projection_pdf_url}
                >
                  Projection
                </button>
              </div>

              {/* タブ内容（スクロール領域） */}
              <div className="flex-1 overflow-y-auto bg-[#2A2A2A] rounded p-2 text-sm whitespace-pre-wrap">
                {activeTab === "statement" &&
                  (selected.text_content || "ステートメントのテキストはありません。")}
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

              {/* ステートメントPDFリンク（下部固定） */}
              {selected.statement_pdf_url && (
                <a
                  href={selected.statement_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 px-3 py-1 bg-[#D4B08C] text-[#1C1C1C] rounded hover:bg-[#e6c88a] text-sm self-start"
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