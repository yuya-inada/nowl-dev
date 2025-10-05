import React, { useState, useEffect } from "react";

const EconomicCalendar = () => {
  const [calendarView, setCalendarView] = useState("TODAY");
  const [todayEvents, setTodayEvents] = useState([]);
  const [weekEvents, setWeekEvents] = useState([]);  // 配列で週ごとに日別データを持つ
  const [monthEvents, setMonthEvents] = useState([]); // 配列で月ごとに週ごとに日別データを持つ
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const weekday = weekdays[today.getDay()];
    return `${year}/${month}/${day} (${weekday})`;
  };

  // ===== API取得 =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayRes = await fetch("http://localhost:8081/economic-calendar/today");
        const weekRes = await fetch("http://localhost:8081/economic-calendar/week");
        const monthRes = await fetch("http://localhost:8081/economic-calendar/month");
        if (!todayRes.ok || !weekRes.ok || !monthRes.ok) throw new Error("HTTP error");

        const todayData = await todayRes.json();
        const weekData = await weekRes.json();     // 週データ: [{ day, date, events: [...] }, ...]
        const monthData = await monthRes.json();   // 月データ: [[{ date, events: [...] }, ...], ...]

        setTodayEvents(todayData);
        setWeekEvents(weekData);
        setMonthEvents(monthData);
      } catch (err) {
        console.error("API取得エラー:", err);
      }
    };
    fetchData();
  }, []);

  const renderTable = (events) => (
    <table className="w-full text-sm border border-[#3A3A3A]">
      <thead>
        <tr className="bg-[#3A3A3A] text-[#D4B08C]">
          <th className="p-2 border-b border-[#4A4A4A] text-center">Status</th>
          <th className="p-2 border-b border-[#4A4A4A] text-center">Time</th>
          <th className="p-2 border-b border-[#4A4A4A] text-center">Country</th>
          <th className="p-2 border-b border-[#4A4A4A] text-left">Event</th>
          <th className="p-2 border-b border-[#4A4A4A] text-right">Actual</th>
          <th className="p-2 border-b border-[#4A4A4A] text-right">Forecast</th>
          <th className="p-2 border-b border-[#4A4A4A] text-right">Previous</th>
          <th className="p-2 border-b border-[#4A4A4A] text-center">Importance</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event, index) => {
          const time = new Date(event.event_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          return (
            <tr key={index} className="border-b border-[#4A4A4A] last:border-b-0">
              <td className="p-2 text-center">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  event.status === "未発表" ? "text-red-400" : "text-[#D4B08C]"
                }`}>
                  {event.status || ""}
                </span>
              </td>
              <td className="p-2 font-mono text-[#8A7A6A] text-center">{time}</td>
              <td className="p-2 font-semibold text-[#D4B08C] text-center">{event.country_code}</td>
              <td className="p-2 text-[#D4B08C] text-left">{event.indicator_name}</td>
              <td className="p-2 text-right">{event.actual_value || ""}</td>
              <td className="p-2 text-right">{event.forecast_value || ""}</td>
              <td className="p-2 text-right">{event.previous_value || ""}</td>
              <td className="p-2 text-center">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  event.importance === "HIGH" ? "bg-red-600 text-white" :
                  event.importance === "MEDIUM" ? "bg-yellow-500 text-black" :
                  "bg-gray-500 text-gray-300"
                }`}>
                  {event.importance || ""}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
      {/* Header */}
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">ECONOMIC CALENDAR</h2>
        <div className="flex space-x-1">
          {["TODAY","WEEK","MONTH"].map(view => (
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

      <div className="p-4">
        {/* TODAY */}
        {calendarView === "TODAY" && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[#D4B08C] mb-2">{getCurrentDate()}</h3>
            {renderTable(todayEvents)}
          </div>
        )}

        {/* WEEK */}
        {calendarView === "WEEK" && weekEvents.length > 0 && weekEvents[currentWeek]?.days && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#D4B08C]">週表示</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                  disabled={currentWeek === 0}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
                >
                  前週
                </button>
                <button
                  onClick={() => setCurrentWeek(Math.min(weekEvents.length - 1, currentWeek + 1))}
                  disabled={currentWeek === weekEvents.length - 1}
                  className="px-2 py-1 text-xs bg-[#4A4A4A] text-[#8A7A6A] rounded hover:bg-[#5A5A5A]"
                >
                  翌週へ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {weekEvents[currentWeek].days.map((day, index) => (
                <div key={index} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2">
                  ...
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MONTH */}
        {calendarView === "MONTH" && monthEvents.length > 0 && monthEvents[currentMonth]?.weeks && (
          <div>
            {monthEvents[currentMonth].weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-5 gap-2">
                {week.map((day, dayIndex) => (
                  <div key={dayIndex} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2 h-20">
                    ...
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
              </div>
            </div>
          );
        };

export default EconomicCalendar;