import React, { useState, useEffect } from "react";

const weekdayMap = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
  月曜日: "Mon",
  火曜日: "Tue",
  水曜日: "Wed",
  木曜日: "Thu",
  金曜日: "Fri",
  土曜日: "Sat",
  日曜日: "Sun",
  月: "Mon",
  火: "Tue",
  水: "Wed",
  木: "Thu",
  金: "Fri",
  土: "Sat",
  日: "Sun",
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
  const [weeklyCalendar, setWeeklyCalendar] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const getCurrentDate = () => {
    const dow = weekdayMap[currentDate.getDay()];
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    return `${dow}, ${y}/${m}/${d}`;
  };

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
        importance: e.importance || "", // ← 重要度も保持
        status: e.status || "",
      }));
      setEconomicCalendar({ TODAY: events });
    } catch (err) {
      console.error("API fetch error (day):", err);
      setEconomicCalendar({ TODAY: [] });
    }
  };

  // ✅ WEEK API
  const fetchWeek = async (baseDate) => {
    try {
      const dateStr = toDateStr(baseDate);
      const res = await fetch(`http://localhost:8081/economic-calendar/week?date=${dateStr}`);
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      const week = {
        week_start: data.week_start,
        week_end: data.week_end,
        days: data.days.map((d) => ({
          day: weekdayMap[d.weekday] || d.weekday,
          date: d.date,
          events: d.events.map((e) => ({
            time: fmtTime(e.event_datetime),
            event: e.indicator_name,
            importance: e.importance,
            status: e.status,
          })),
        })),
      };
      setWeeklyCalendar(week);
    } catch (err) {
      console.error("API fetch error (week):", err);
      setWeeklyCalendar(null);
    }
  };

  useEffect(() => {
    fetchDay(currentDate);
  }, []);

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    fetchDay(newDate);
  };

  const switchToWeekView = () => {
    const today = new Date(currentDate);
    const dow = today.getDay();
    const monday = new Date(today);
    if (dow === 0) monday.setDate(today.getDate() + 1);
    else monday.setDate(today.getDate() - (dow - 1));
    setCurrentDate(monday);
    setWeekOffset(0);
    fetchWeek(monday);
    setCalendarView("WEEK");
  };

  const changeWeek = (direction) => {
    const newOffset = weekOffset + direction;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setWeekOffset(newOffset);
    setCurrentDate(newDate);
    fetchWeek(newDate);
  };

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
      {/* ==== HEADER ==== */}
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">ECONOMIC CALENDAR</h2>
        <div className="flex space-x-1">
          <button
            onClick={() => setCalendarView("TODAY")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              calendarView === "TODAY"
                ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
            }`}
          >
            TODAY
          </button>
          <button
            onClick={switchToWeekView}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              calendarView === "WEEK"
                ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
            }`}
          >
            WEEK
          </button>
        </div>
      </div>

      {/* ==== BODY ==== */}
      <div className="p-4">
        {/* === TODAY VIEW === */}
        {calendarView === "TODAY" && (
          <div>
            <div className="mb-4 pb-2 border-b border-[#3A3A3A] flex items-center justify-between">
              <button
                onClick={() => changeDate(-1)}
                className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
              >
                Previous Day
              </button>
              <h3 className="text-base font-semibold text-[#D4B08C]">{getCurrentDate()}</h3>
              <button
                onClick={() => changeDate(1)}
                className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
              >
                Next Day
              </button>
            </div>

            {(economicCalendar.TODAY || []).length === 0 ? (
              <div className="text-[#8A7A6A] text-center py-4">No data for this day.</div>
            ) : (
              <div className="space-y-2">
                {(economicCalendar.TODAY || []).map((event, i) => (
                  <div key={i} className="border-b border-[#3A3A3A] py-2 text-sm text-[#D4B08C]">
                    {/* --- イベントタイトル行 --- */}
                    <div className="flex items-center space-x-3">
                      {/* 重要度インジケータ */}
                      <span
                        className={`w-2 h-2 rounded-full ${
                          event.importance === "HIGH"
                            ? "bg-red-500"
                            : event.importance === "MEDIUM"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      ></span>
                      <div className="w-12 text-[#8A7A6A] text-sm font-mono">{event.time}</div>
                      <div className="w-8 text-[#D4B08C] text-sm font-semibold">{event.country}</div>
                      <div className="text-[#D4B08C] text-sm">{event.event}</div>
                    </div>

                    {/* --- 結果・予想・前回 --- */}
                    <div className="grid grid-cols-3 gap-4 ml-16 text-xs mt-1">
                      <div className="text-center">
                        <div className="text-[#8A7A6A] mb-1">結果</div>
                        <div
                          className={`font-mono font-semibold ${
                            event.result === "-" ? "text-[#8A7A6A]" : "text-[#D4B08C]"
                          }`}
                        >
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

        {/* === WEEK VIEW === */}
        {calendarView === "WEEK" && weeklyCalendar && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#D4B08C]">Weekly View</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => changeWeek(-1)}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
                >
                  Previous Week
                </button>
                <button
                  onClick={() => changeWeek(1)}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
                >
                  Next Week
                </button>
              </div>
            </div>

            <h3 className="text-[#D4B08C] text-sm mb-3">
              {weeklyCalendar.week_start} – {weeklyCalendar.week_end}
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {weeklyCalendar.days.map((day, idx) => (
                <div key={idx} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2">
                  <div className="text-center mb-2">
                    <div className="text-xs font-semibold text-[#D4B08C]">{day.day}</div>
                    <div className="text-xs text-[#8A7A6A]">{day.date}</div>
                  </div>
                  <div className="space-y-1">
                    {day.events.map((ev, i) => (
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