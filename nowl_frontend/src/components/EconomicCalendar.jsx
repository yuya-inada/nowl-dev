import React, { useState } from "react";

const EconomicCalendar = () => {
  const [calendarView, setCalendarView] = useState("TODAY");
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);

  // ==== ダミーデータ ====
  const weeklyCalendar = [
    {
      week: 0,
      days: [
        { day: "月", date: "12/23", events: [
            { time: "08:30", event: "日銀政策会合", country: "JP", importance: "HIGH" },
            { time: "10:00", event: "消費者物価指数", country: "JP", importance: "MEDIUM" }
          ]
        },
        { day: "火", date: "12/24", events: [
            { time: "21:30", event: "米雇用統計", country: "US", importance: "HIGH" },
            { time: "22:00", event: "ISM製造業指数", country: "US", importance: "MEDIUM" }
          ]
        },
        { day: "水", date: "12/25", events: [
            { time: "18:00", event: "ECB政策金利", country: "EU", importance: "HIGH" }
          ]
        },
        { day: "木", date: "12/26", events: [
            { time: "11:00", event: "中国PMI", country: "CN", importance: "LOW" },
            { time: "15:00", event: "独IFO指数", country: "DE", importance: "MEDIUM" }
          ]
        },
        { day: "金", date: "12/27", events: [
            { time: "22:30", event: "米GDP速報", country: "US", importance: "HIGH" }
          ]
        },
      ],
    },
    {
      week: 1,
      days: [
        { day: "月", date: "12/30", events: [
            { time: "09:00", event: "日本鉱工業生産", country: "JP", importance: "MEDIUM" }
          ]
        },
        { day: "火", date: "12/31", events: [
            { time: "21:30", event: "米個人所得", country: "US", importance: "MEDIUM" }
          ]
        },
        { day: "水", date: "1/1", events: [
            { time: "休場", event: "元日", country: "JP", importance: "LOW" }
          ]
        },
        { day: "木", date: "1/2", events: [
            { time: "休場", event: "年始休場", country: "JP", importance: "LOW" }
          ]
        },
        { day: "金", date: "1/3", events: [
            { time: "09:00", event: "取引開始", country: "JP", importance: "MEDIUM" }
          ]
        },
      ],
    },
  ];

  const monthlyCalendar = [
    {
      month: 0,
      weeks: [
        [
          { date: "1/1", events: [{ event: "元日", importance: "LOW" }] },
          { date: "1/2", events: [{ event: "年始休場", importance: "LOW" }] },
          { date: "1/3", events: [{ event: "取引開始", importance: "MEDIUM" }] },
          { date: "1/4", events: [{ event: "米雇用統計", importance: "HIGH" }] },
          { date: "1/5", events: [{ event: "ECB政策金利", importance: "HIGH" }] },
        ],
        [
          { date: "1/8", events: [{ event: "日銀政策会合", importance: "HIGH" }] },
          { date: "1/9", events: [{ event: "中国CPI", importance: "MEDIUM" }] },
          { date: "1/10", events: [{ event: "米CPI", importance: "HIGH" }] },
          { date: "1/11", events: [{ event: "独ZEW指数", importance: "MEDIUM" }] },
          { date: "1/12", events: [{ event: "米PPI", importance: "MEDIUM" }] },
        ],
        [
          { date: "1/15", events: [{ event: "中国GDP", importance: "HIGH" }] },
          { date: "1/16", events: [{ event: "米小売売上高", importance: "HIGH" }] },
          { date: "1/17", events: [{ event: "英CPI", importance: "MEDIUM" }] },
          { date: "1/18", events: [{ event: "日本CPI", importance: "HIGH" }] },
          { date: "1/19", events: [{ event: "米住宅着工", importance: "LOW" }] },
        ],
        [
          { date: "1/22", events: [{ event: "日銀金融政策", importance: "HIGH" }] },
          { date: "1/23", events: [{ event: "米FOMC", importance: "HIGH" }] },
          { date: "1/24", events: [{ event: "ECB理事会", importance: "HIGH" }] },
          { date: "1/25", events: [{ event: "米GDP", importance: "HIGH" }] },
          { date: "1/26", events: [{ event: "日本失業率", importance: "MEDIUM" }] },
        ],
      ],
    },
  ];

  const economicCalendar = {
    TODAY: [
      { time: "08:30", event: "日銀政策会合", country: "JP", importance: "HIGH" },
      { time: "10:00", event: "消費者物価指数", country: "JP", importance: "HIGH" },
      { time: "14:00", event: "鉱工業生産", country: "JP", importance: "MEDIUM" },
      { time: "21:30", event: "米雇用統計", country: "US", importance: "HIGH" },
      { time: "21:30", event: "失業率", country: "US", importance: "HIGH" },
      { time: "21:30", event: "平均時給", country: "US", importance: "MEDIUM" },
      { time: "22:00", event: "ISM製造業指数", country: "US", importance: "HIGH" },
      { time: "23:30", event: "原油在庫量", country: "US", importance: "MEDIUM" },
      { time: "18:00", event: "ECB政策金利", country: "EU", importance: "HIGH" },
      { time: "18:45", event: "ECB総裁会見", country: "EU", importance: "HIGH" },
    ],
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const weekday = weekdays[today.getDay()];
    return `${year}/${month}/${day} (${weekday})`;
  };

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">ECONOMIC CALENDAR</h2>
        <div className="flex space-x-1">
          {["TODAY","WEEK","MONTH"].map((view) => (
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
          <div>
            <div className="mb-4 pb-2 border-b border-[#3A3A3A]">
              <h3 className="text-base font-semibold text-[#D4B08C]">{getCurrentDate()}</h3>
            </div>
            <div className="space-y-2">
              {economicCalendar.TODAY.map((event, index) => (
                <div key={index} className="py-2 border-b border-[#3A3A3A] last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-mono text-[#8A7A6A] w-12">{event.time}</div>
                      <div className="text-sm font-semibold text-[#D4B08C] w-8">{event.country}</div>
                      <div className="text-sm text-[#D4B08C]">{event.event}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      event.importance === "HIGH" ? "bg-red-600 text-white" :
                      event.importance === "MEDIUM" ? "bg-yellow-600 text-black" :
                      "bg-[#4A4A4A] text-[#8A7A6A]"
                    }`}>{event.importance.charAt(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEEK */}
        {calendarView === "WEEK" && (
          <div className="grid grid-cols-5 gap-2">
            {weeklyCalendar[currentWeek].days.map((day, index) => (
              <div key={index} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2">
                <div className="text-center mb-2">
                  <div className="text-xs font-semibold text-[#D4B08C]">{day.day}</div>
                  <div className="text-xs text-[#8A7A6A]">{day.date}</div>
                </div>
                <div className="space-y-1">
                  {day.events.map((event, i) => (
                    <div key={i} className="text-xs text-[#D4B08C]">{event.time} {event.event}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MONTH */}
        {calendarView === "MONTH" && (
          <div className="space-y-2">
            {monthlyCalendar[currentMonth].weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-5 gap-2">
                {week.map((day, dayIndex) => (
                  <div key={dayIndex} className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2 h-20">
                    <div className="text-xs text-[#8A7A6A] mb-1">{day.date}</div>
                    <div className="space-y-1">
                      {day.events.map((event, i) => (
                        <div key={i} className="text-xs text-[#D4B08C]">{event.event}</div>
                      ))}
                    </div>
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