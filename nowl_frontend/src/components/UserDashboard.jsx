import React, { useState } from "react";
import TopNav from "./TopNav";
import CompositeChart from "./CompositeChart";
import GlobalIndices from "./GlobalIndices";
import EconomicCalendar from "./EconomicCalendar";
import NowlNews from "./NowlNews";
import SentimentMeter from "./SentimentMeter";
import BottomNav from "./BottomNav";
import TokyoStockInvestor from "./TokyoStockInvestor";

export default function UserDashboard() {
  const [calendarView, setCalendarView] = useState("TODAY");

  // サンプルデータ
  const nowlAdvice = {
    opportunities: [
      { impact: "HIGH", time: "09:00", title: "日経225買いシグナル", suggestion: "短期で買い検討" },
      { impact: "MEDIUM", time: "12:00", title: "米株動向注目", suggestion: "状況見極め" }
    ],
    weeklyAdvice: "今週はテクノロジーセクターに注目。"
  };

  const investorTypeData = [
    { type: "個人", buy: "1200", sell: "900", net: "+300" },
    { type: "海外", buy: "1500", sell: "1800", net: "-300" },
  ];

  const tokyoStockData = [
    { date: "2023-08-01", nikkei: "32500", topix: "2250", change: "+150" },
    { date: "2023-08-02", nikkei: "32400", topix: "2240", change: "-100" },
  ];

  return (
    <div className="text-center">
      <h1>Welcome, User!</h1>
      <p>Here is your personal dashboard.</p>
      <hr />
  
      {/* ユーザー向けのコンポーネントやデータ表示 */}
      <div className=" flex flex-col items-center">
        
        {/* 横幅をPCでちょうどよく中央寄せ */}
        <div className="w-full max-w-2xl mx-auto border-8 border-green-500 bg-yellow-200 px-4 sm:px-6 lg:px-8 box-border">
          <TopNav />
          <CompositeChart />
          <GlobalIndices />
          <TokyoStockInvestor
            tokyoStockData={tokyoStockData}
            investorTypeData={investorTypeData}
          />
          <SentimentMeter />
          <EconomicCalendar calendarView={calendarView} setCalendarView={setCalendarView} />
          <NowlNews nowlAdvice={nowlAdvice} />
          <BottomNav />
        </div>
        
      </div>
    </div>
  );
  };