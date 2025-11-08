import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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
};


// JST固定で日付文字列（YYYY-MM-DD）
const toJSTDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

// JST固定で時刻 HH:mm
const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const EconomicCalendar = () => {
  const [calendarView, setCalendarView] = useState("TODAY");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [economicCalendar, setEconomicCalendar] = useState({ TODAY: [] });
  const [weeklyCalendar, setWeeklyCalendar] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthlyCalendar, setMonthlyCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getCurrentDate = () => {
    const dow = weekdayMap[currentDate.getDay()];
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    return `${dow}, ${y}/${m}/${d}`;
  };

  // ✅ DAY API
  const fetchDay = async (dateObj) => {
    const dateStr = toJSTDateStr(dateObj);
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
      const dateStr = toJSTDateStr(baseDate);
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

  // ✅ MONTH API
  const fetchMonth = async (year, month) => {
    try {
      const res = await fetch(`http://localhost:8081/economic-calendar/month?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      setMonthlyCalendar([data]); 
      setCurrentMonth(month);
      setCurrentYear(year);
    } catch (err) {
      console.error("API fetch error (month):", err);
      setMonthlyCalendar([]);
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

  useEffect(() => {
    fetchMonth(currentYear, currentMonth);
  }, []);

  // ✅ 月切り替え
  const buildCalendarGrid = (monthData, year, month) => {
    const firstDay = new Date(year, month - 1, 1); // 月初
    const lastDay = new Date(year, month, 0); // 月末
    const weeks = [];
    let week = [];
  
    // 月初の前の週を前月日で埋める
    for (let i = 1 - firstDay.getDay(); i <= 0; i++) {
      const date = new Date(year, month - 1, i);
      week.push({
        date: date.toISOString().split("T")[0],
        events: [],
        isCurrentMonth: false
      });
    }
  
    // 当月の日付を追加
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month - 1, d);
      const dayData = monthData.weeks.flat().find((x) => x.date === date.toISOString().split("T")[0]);
      week.push({
        date: date.toISOString().split("T")[0],
        events: dayData ? dayData.events : [],
        isCurrentMonth: true
      });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
  
    // 月末の週を次月日で埋める
    if (week.length > 0) {
      let nextMonthDay = 1;
      while (week.length < 7) {
        const date = new Date(year, month, nextMonthDay++);
        week.push({
          date: date.toISOString().split("T")[0],
          events: [],
          isCurrentMonth: false
        });
      }
      weeks.push(week);
    }
  
    return weeks;
  };

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
      {/* ==== HEADER ==== */}
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">ECONOMIC CALENDAR</h2>
        <Link
          to="/calendar/logs"
          className="text-xs text-[#D4B08C] bg-[#4A4A4A] px-2 py-1 rounded hover:bg-[#5A5A5A]"
        >
          Logs
        </Link>
      </div>
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
          <button
            onClick={() => {
              const today = new Date();
              fetchMonth(today.getFullYear(), today.getMonth() + 1);
              setCalendarView("MONTH");
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              calendarView === "MONTH"
                ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                : "bg-[#4A4A4A] text-[#8A7A6A] hover:bg-[#5A5A5A]"
            }`}
          >
            MONTH
          </button>
        </div>
      </div>

      {/* ==== BODY ==== */}
      <div className="p-4">
        {/* === TODAY VIEW === */}
        {calendarView === "TODAY" && (
          <div>
            <div className="sticky top-0 z-10 bg-[#2A2A2A] border-b border-[#4A4A4A] px-4 py-2 mb-2">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => changeDate(-1)}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#D4B08C]  rounded hover:bg-[#5A5A5A]"
                >
                  Previous Day
                </button>

                <h1 className="text-2xl text-[#D4B08C]">{getCurrentDate()}</h1>

                <button
                  onClick={() => changeDate(1)}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#D4B08C]  rounded hover:bg-[#5A5A5A]"
                >
                  Next Day
                </button>
              </div>
            </div>
            {(economicCalendar.TODAY || []).length === 0 ? (
                <div className="text-[#8A7A6A] text-center text-3xl py-4">
                  No data for this day.
                </div>
            ) : (
              <div className="space-y-1">
                {/* === ヘッダー（固定） === */}
                <div className="sticky top-0 z-10 bg-[#2A2A2A]">
                  <div className="grid grid-cols-[50px_80px_80px_1fr_150px_150px_150px] gap-2 text-xs text-[#8A7A6A] font-semibold border-b border-[#3A3A3A] pb-1">
                    <div className="text-center">Importance</div>
                    <div className="text-center">Time</div>
                    <div className="text-center">Country</div>
                    <div>Event Name</div>
                    <div className="text-center">Result</div>
                    <div className="text-center">Prediction</div>
                    <div className="text-center">Previous</div>
                  </div>
                </div>
            
                {/* === イベントリスト（スクロール領域） === */}
                  <div className="h-[500px] overflow-y-auto pr-2"> 
                  {(economicCalendar.TODAY || []).map((event, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[50px_80px_80px_1fr_150px_150px_150px] gap-2 text-sm text-[#D4B08C] border-b border-[#3A3A3A] py-1 items-center"
                    >
                     {/* 重要度の丸 */}
                      <span
                        className={`w-2 h-2 rounded-full justify-self-center ${
                          event.importance === "HIGH"
                            ? "bg-red-500"
                            : event.importance === "MEDIUM"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      ></span>
            
                      {/* 時間 */}
                      <div className="text-[#8A7A6A] text-base text-center">{event.time}</div>
            
                      {/* 国 */}
                      <div className="text-sm font-semibold text-[#D4B08C] text-center">{event.country}</div>
            
                      {/* イベント名 */}
                      <div className="text-base text-left">{event.event}</div>
            
                      {/* 結果 */}
                      <div
                        className={`text-base font-semibold text-center ${
                          event.result === "-" ? "text-[#8A7A6A]" : "text-[#D4B08C]"
                        }`}
                      >
                      {event.result}
                    </div>
            
                    {/* 予想 */}
                    <div className="text-base text-center">
                      {event.forecast}
                    </div>
            
                    {/* 前回 */}
                    <div className="text-base text-center">
                      {event.previous}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === WEEK VIEW === */}
        {calendarView === "WEEK" && weeklyCalendar && (
          // 👇ここもそのまま保持
          <div>
            <div className="sticky top-0 z-10 bg-[#2A2A2A] border-b border-[#4A4A4A] px-4 py-2 mb-2">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => changeWeek(-1)}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#D4B08C] rounded hover:bg-[#5A5A5A]"
                >
                  Previous Week
                </button>

                <h1 className="text-2xl text-[#D4B08C]">
                  {weeklyCalendar.week_start} – {weeklyCalendar.week_end}
                </h1>

                <button
                  onClick={() => changeWeek(1)}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#D4B08C] rounded hover:bg-[#5A5A5A]"
                >
                  Next Week
                </button>
              </div>
            </div>
            <div className="h-[500px] overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {weeklyCalendar.days.map((day, idx) => (
                  <div key={idx} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2">
                    <div className="text-center mb-2">
                      <div className="text-lg font-semibold text-[#D4B08C]">{day.day}</div>
                      <div className="text-lg text-[#8A7A6A]">{day.date}</div>
                    </div>
                    <hr className="mb-3 border-t-2 border-[#8A7A6A]" />
                    <div className="space-y-1">
                      {day.events.map((ev, i) => (
                        <div key={i} className="flex items-start text-xs text-[#D4B08C]">
                          {/* 重要度丸アイコン */}
                          <span
                            className={`w-2 h-2 rounded-full mt-0.5 ${
                              ev.importance === "HIGH"
                                ? "bg-red-500"
                                : ev.importance === "MEDIUM"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          ></span>
                          
                          {/* 時間 */}
                          <span className="text-[#8A7A6A] ml-1">{ev.time}</span>
                          
                          {/* イベント名 */}
                          <span className="pl-2 text-left">{ev.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === MONTH VIEW HEADER === */}
        {calendarView === "MONTH" && (
          <div>
            <div className="sticky top-0 z-10 bg-[#2A2A2A] border-b border-[#4A4A4A] px-4 py-2 mb-2">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => {
                    let newMonth = currentMonth - 1;
                    let newYear = currentYear;
                    if (newMonth === 0) {
                      newMonth = 12;
                      newYear -= 1;
                    }
                    fetchMonth(newYear, newMonth);
                  }}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#D4B08C] rounded hover:bg-[#5A5A5A]"
                >
                  Previous Month
                </button>

                <h1 className="text-2xl text-[#D4B08C]">{currentYear} / {String(currentMonth).padStart(2,"0")}</h1>

                <button
                  onClick={() => {
                    let newMonth = currentMonth + 1;
                    let newYear = currentYear;
                    if (newMonth === 13) {
                      newMonth = 1;
                      newYear += 1;
                    }
                    fetchMonth(newYear, newMonth);
                  }}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#D4B08C] rounded hover:bg-[#5A5A5A]"
                >
                  Next Month
                </button>
              </div>
            </div>
            {calendarView === "MONTH" && monthlyCalendar.length > 0 && (
              <div className="space-y-2">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-5 gap-2 mb-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map((dow) => (
                    <div key={dow} className="text-base text-[#D4B08C] text-center">
                      {dow}
                    </div>
                  ))}
                </div>
                <div className="px-4">
                  {/* カレンダー本体（buildCalendarGrid で生成されたもの） */}
                  {buildCalendarGrid(monthlyCalendar[0], currentYear, currentMonth)
                    .map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-5 gap-2 mb-1">
                        {week
                          .filter((day) => {
                            const dow = new Date(day.date).getDay();
                            return dow >= 1 && dow <= 5; // 月〜金
                          })
                          .map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2 h-30 ${
                                day.isCurrentMonth ? "" : "text-gray-400"
                              }`}
                            >
                              <div className="text-xs text-[#8A7A6A] mb-1">{day.date}</div>
                              <div className="space-y-1">
                                {day.events.length > 0 ? (
                                  day.events.slice(0, 6).map((event, eventIndex) => (
                                    <div key={eventIndex} className="flex items-center space-x-1 text-xs text-[#D4B08C]">
                                      <span
                                        className={`w-1 h-1 rounded-full ${
                                          event.importance === "HIGH" ? "bg-red-500" : "bg-gray-500"
                                        }`}
                                      ></span>
                                      {/* 国 */}
                                      <span className="font-semibold">{event.country}</span>
                                      {/* 経済指標名 */}
                                      <span className="truncate">{event.event}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-[#8A7A6A]">No data</div>
                                )}
                                {day.events.length > 6 && (
                                  <div className="text-xs text-[#8A7A6A]">+{day.events.length - 6} more</div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EconomicCalendar;