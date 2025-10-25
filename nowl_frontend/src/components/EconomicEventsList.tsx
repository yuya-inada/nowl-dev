// src/components/EconomicEventsList.tsx
// 金融イベント詳細表示セクション
// 【FOMC】・米国連邦公開市場委員会
// 【BOJ MPC】・日本銀行金融政策決定会合
// 【ECB Meeting】・欧州中央銀行理事会
// 【BOE MPC】・英中銀金融政策委員会

import React, { useEffect, useState } from "react";
import { fetchEconomicEvents, EconomicEvent } from "../api/economicEvents";

export const EconomicEventsList = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selected, setSelected] = useState<EconomicEvent | null>(null);

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
              onClick={() => setSelected(e)}
            >
              <div>{e.event_date}</div>
              <div className="font-semibold">{e.event_name}</div>
            </li>
          ))}
        </ul>

        {/* 右：選択イベント詳細 */}
        <div className="w-2/3 p-2">
          {selected ? (
            <div>
              <h3 className="text-lg font-bold">{selected.event_name}</h3>
              <p>日付: {selected.event_date}</p>
              <p>国: {selected.country_code}</p>
              {/* PDFリンクはここに追加予定 */}
            </div>
          ) : (
            <p>イベントを選択してください</p>
          )}
        </div>
      </div>
    </div>
  );
};