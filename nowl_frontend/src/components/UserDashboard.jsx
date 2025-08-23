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
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] font-hiragino-mincho">
      {/* ヘッダー */}
      <TopNav />

      {/* 本体コンテンツ：ヘッダー分のパディングを確保 */}
      <div className="pt-[10px] w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">Welcome, User!</h1>
        <p className="mb-6">Here is your personal dashboard.</p>

        {/* ダッシュボード主要コンテンツ */}
        <div className="space-y-6">
          <CompositeChart />
          <GlobalIndices />
          <TokyoStockInvestor tokyoStockData={tokyoStockData} investorTypeData={investorTypeData} />
          <SentimentMeter />
          <EconomicCalendar calendarView={calendarView} setCalendarView={setCalendarView} />
          <NowlNews nowlAdvice={nowlAdvice} />
        </div>

        {/* フッター */}
        <BottomNav />
      </div>
    </div>
  );
}