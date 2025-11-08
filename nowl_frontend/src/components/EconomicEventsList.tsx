import React, { useEffect, useRef, useState } from "react";
import { fetchEconomicEvents, EconomicEvent } from "../api/economicEvents";
import { useNavigate } from "react-router-dom";

export const EconomicEventsList = ({ currentUser }) => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selected, setSelected] = useState<EconomicEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"statement" | "press" | "projection">("statement");
  const [filter, setFilter] = useState<string>("");
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEconomicEvents()
      .then((data) => {
        setEvents(data);
  
        const today = new Date();
        const latestPastEvent = data
          .filter(e => new Date(e.event_date) <= today)
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
  
        if (latestPastEvent) setSelected(latestPastEvent);
      })
      .catch(console.error);
  }, []);

  const filtered = filter
  ? events.filter((e) => e.event_name === filter)
  : events;

  useEffect(() => {
    if (listRef.current && filtered.length) {
      const today = new Date();
      const latestPastIndex = filtered.findIndex(
        (e) => new Date(e.event_date) <= today
      );
      if (latestPastIndex >= 0) {
        const itemHeight = 30;
        listRef.current.scrollTop = Math.max(itemHeight * (latestPastIndex - 2), 0);
      }
    }
  }, [filtered]);
  const eventNameMap: Record<string, string> = {
    "BOJ Minutes": "日銀金融政策議事要旨",
    "FOMC": "FOMC",
    "ECB": "ECB",
    "Jackson Hole": "ジャクソンホール",
    // 他も必要なら追加
  };

  return (
    <div className="bg-[#2A2A2A] rounded shadow-xl">
      {/* ==== HEADER ==== */}
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">
            ECONOMIC EVENTS
          </h2>
          {/* 管理者以上のみ「ログ画面」ボタン表示 */}
          {(currentUser?.role === "ROLE_ADMIN" || currentUser?.role === "ROLE_SUPERADMIN") && (
            <button
              onClick={() => navigate("/logs-economic-event")}
              className="text-xs text-[#D4B08C] bg-[#4A4A4A] px-2 py-1 rounded hover:bg-[#5A5A5A]"
            >
              Economic Event Logs
            </button>
          )}
        </div>
      </div>

      {/* ==== BODY ==== */}
      <div className="flex gap-4 h-[580px] p-4">
        {/* 左：イベントリスト */}
        <div className="w-1/4 border-r border-[#555] pr-2 flex flex-col">
          {/* フィルタボタン */}
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              key="All"
              onClick={() => setFilter("")}
              className={`px-2 py-1 rounded text-sm transition ${
                filter === "" ? "bg-[#8B4513] text-[#D4B08C]" : "bg-[#333] hover:bg-[#444] text-[#CCC]"
              }`}
            >
              All
            </button>

            {Array.from(new Set(events.map((e) => e.event_name))).map((name) => (
              <button
                key={name}
                onClick={() => setFilter(name)}
                className={`px-2 py-1 rounded text-sm transition ${
                  filter === name
                    ? "bg-[#8B4513] text-[#D4B08C]"
                    : "bg-[#333] hover:bg-[#444] text-[#CCC]"
                }`}
              >
                {eventNameMap[name] || name}
              </button>
            ))}
          </div>

          {/* イベントリスト */}
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
                  <div className="flex items-center justify-between text-sm">
                    {/* 左：日付 */}
                    <span className="w-1/4">{e.event_date}</span>

                    {/* 中央：イベント名称 */}
                    <span className="w-2/4 font-semibold text-left pl-2">
                      {eventNameMap[e.event_name] || e.event_name}
                    </span>

                    {/* 右：Upcoming */}
                    <span className="w-1/4 text-right text-[#FFD700] text-xs">
                      {isFuture ? "Upcoming" : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 右：選択イベント詳細 */}
        <div className="w-3/4 flex flex-col p-2">
          {selected ? (
            <div className="bg-[#1F1F1F] p-4 rounded-lg shadow-md flex flex-col h-full">
              {/* ヘッダー */}
              <div className="flex items-center mb-2">
                <p className="text-3xl font-bold">{eventNameMap[selected.event_name] || selected.event_name}</p>
                <p className="text-sm text-[#AAAAAA] ml-3">{selected.event_date}</p>
                <p className="text-sm text-[#AAAAAA] ml-3">国: {selected.country_code}</p>
              </div>

              {/* タブボタン */}
              <div className="flex gap-2 mb-3">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "statement"
                      ? "bg-[#8B4513] text-[#D4B08C]"
                      : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("statement")}
                >
                  Statement
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === "press"
                      ? "bg-[#8B4513] text-[#D4B08C]"
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
                      ? "bg-[#8B4513] text-[#D4B08C]"
                      : "bg-[#333] text-[#CCC]"
                  }`}
                  onClick={() => setActiveTab("projection")}
                  disabled={!selected.projection_pdf_url}
                >
                  Projection
                </button>
              </div>

              {/* タブ内容（スクロール領域） */}
              <div className="flex-1 overflow-y-auto bg-[#2A2A2A] rounded p-2 pl-10 text-base whitespace-pre-wrap text-left mb-1">
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
                  className="mt-2 px-3 py-1 bg-[#8B4513] text-[#D4B08C] rounded hover:bg-[#e6c88a] text-sm self-start"
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