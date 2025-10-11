// ✅ 修正版 Reactコード

import React, { useState, useEffect } from "react";

const weekdayShort = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const toDateStr = (d) => d.toISOString().split("T")[0];
const fmtTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const EconomicCalendar = () => {
  const [calendarView, setCalendarView] = useState("TODAY");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [economicCalendar, setEconomicCalendar] = useState({ TODAY: [] });
  const [weeklyCalendar, setWeeklyCalendar] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);

  // 日付表示フォーマット
  const getCurrentDate = () =>
    currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  // ✅ DAY API
  const fetchDay = async (dateObj) => {
    const dateStr = toDateStr(dateObj);
    try {
      const res = await fetch(`http://localhost:8081/economic-calendar/day?date=${dateStr}`);
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      const events = (data.events || []).map((e) => ({
        time: fmtTime(e.event_datetime),
        country: e.country_code,
        event: e.indicator_name,
        result: e.actual_value || "-",
        forecast: e.forecast_value || "",
        previous: e.previous_value || "",
        importance: e.importance || "",
        status: e.status || "",
      }));
      setEconomicCalendar((p) => ({ ...p, TODAY: events }));
    } catch (err) {
      console.error("API fetch error (day):", err);
      setEconomicCalendar((p) => ({ ...p, TODAY: [] }));
    }
  };

  // ✅ WEEK API
  const fetchWeek = async () => {
    try {
      const res = await fetch("http://localhost:8081/economic-calendar/week");
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();

      // data.days[] を React 用に変換
      const week = {
        week_start: data.week_start,
        week_end: data.week_end,
        days: data.days.map((d) => ({
          day: d.weekday,
          date: d.date,
          events: d.events.map((e) => ({
            time: fmtTime(e.event_datetime),
            event: e.indicator_name,
            importance: e.importance,
            status: e.status,
          })),
        })),
      };

      setWeeklyCalendar([week]);
    } catch (err) {
      console.error("API fetch error (week):", err);
      setWeeklyCalendar([]);
    }
  };

  useEffect(() => {
    // 初回 fetch
    fetchDay(currentDate);
    fetchWeek();
  }, []);
  
  // これを追加
  useEffect(() => {
    if (calendarView === "TODAY") {
      fetchDay(currentDate);
    }
  }, [currentDate, calendarView]);

  const changeDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
      {/* ヘッダー */}
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">
          ECONOMIC CALENDAR
        </h2>
        <div className="flex space-x-1">
          {["TODAY", "WEEK"].map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                calendarView === view
                  ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                  : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* 本体 */}
      <div className="p-4">
      {calendarView === "TODAY" && (
  <div>
    {/* 今日のイベント表示 */}
    <div className="mb-4 pb-2 border-b border-[#3A3A3A] flex items-center justify-between">
      <button
        onClick={() => changeDate(-1)}
        className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
      >
        前日
      </button>
      <h3 className="text-base font-semibold text-[#D4B08C]">{getCurrentDate()}</h3>
      <button
        onClick={() => changeDate(1)}
        className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
      >
        翌日
      </button>
    </div>
    {(economicCalendar.TODAY || []).length === 0 ? (
      <div className="text-[#8A7A6A] text-center py-4">データがありません。</div>
    ) : (
      <div className="space-y-2">
        {(economicCalendar.TODAY || []).map((event, i) => (
          <div key={i} className="border-b border-[#3A3A3A] py-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 text-[#8A7A6A] text-sm font-mono">{event.time}</div>
              <div className="w-8 text-[#D4B08C] text-sm font-semibold">{event.country}</div>
              <div className="text-[#D4B08C] text-sm">{event.event}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-16 text-xs mt-1">
              <div className="text-center">
                <div className="text-[#8A7A6A] mb-1">結果</div>
                <div className={`font-mono font-semibold ${event.result === "-" ? "text-[#8A7A6A]" : "text-[#D4B08C]"}`}>
                  {event.result}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[#8A7A6A] mb-1">予想</div>
                <div className="font-mono text-[#D4B08C]">{event.forecast}</div>
              </div>
              <div className="text-center">
                <div className="text-[#8A7A6A] mb-1">前回</div>
                <div className="font-mono text-[#D4B08C]">{event.previous}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {calendarView === "WEEK" && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#D4B08C]">週表示</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(weeklyCalendar[0]?.days || []).map((day, idx) => (
                <div key={idx} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2">
                  <div className="text-center mb-2">
                    <div className="text-xs font-semibold text-[#D4B08C]">{day.day}</div>
                    <div className="text-xs text-[#8A7A6A]">{day.date}</div>
                  </div>
                  <div className="space-y-1">
                    {(day.events || []).map((ev, i) => (
                      <div key={i} className="text-xs text-[#D4B08C]">
                        <div className="flex items-center space-x-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              ev.importance === "HIGH"
                                ? "bg-red-500"
                                : ev.importance === "MEDIUM"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          ></span>
                          <span className="text-[#8A7A6A]">{ev.time}</span>
                        </div>
                        <div className="leading-tight">{ev.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EconomicCalendar;