import React from "react";

export default function EconomicCalendar({ calendarView, setCalendarView }) {
  return (
    <div className="bg-[#3A3A3A] p-4 rounded mb-4">
      <h2 className="text-[#D4B08C] font-semibold mb-2">経済イベントカレンダー</h2>
      <div className="flex space-x-2 mb-2">
        {["TODAY","WEEK","MONTH"].map(view => (
          <button
            key={view}
            onClick={() => setCalendarView(view)}
            className={`px-2 py-1 rounded text-xs ${
              calendarView === view
                ? "bg-[#8B4513] text-[#D4B08C]"
                : "bg-[#4A4A4A] text-[#8A7A6A]"
            }`}
          >
            {view}
          </button>
        ))}
      </div>
      <div className="text-[#8A7A6A] text-sm">カレンダー表示エリア（{calendarView}）</div>
    </div>
  );
}