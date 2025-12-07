import React, { useState } from "react";
import TopNav from "./TopNav";
import CompositeChart from "./CompositeChart";
import GlobalIndices from "./GlobalIndices";
import EconomicCalendar from "./EconomicCalendar";
import Nowlproposals from "./Nowlproposals";
import SentimentMeter from "./SentimentMeter";
import BottomNav from "./BottomNav";
import TokyoStockInvestor from "./TokyoStockInvestor";
import Statusbar from "./Statusbar";
import { EconomicEventsList } from "./EconomicEventsList";

export default function UserDashboard() {
  const [calendarView, setCalendarView] = useState("TODAY");

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] font-hiragino-mincho">

      {/* 本体コンテンツ：ヘッダー分のパディングを確保 */}
      <div className="pt-[10px] w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">Welcome, User!</h1>
        <p className="mb-6">Here is your personal dashboard.</p>

        {/* ダッシュボード主要コンテンツ */}
        <div className="space-y-6">
          <CompositeChart />
          <div className="grid grid-cols-12 gap-4">
            {/* 左カラム：世界主要指数 */}
            <div className="col-span-4">
              <GlobalIndices />
            </div>

            {/* 右カラム：上下に2つ */}
            <div className="col-span-8 space-y-4">
              {/* 上：TokyoStockInvestor */}
              <TokyoStockInvestor/>

              {/* 下：SentimentMeter */}
              <SentimentMeter />
            </div>
          </div>
          <Nowlproposals/>
          <EconomicCalendar />
          <EconomicEventsList />
        </div>

        {/* ステータスバー */}
        <Statusbar />

        {/* フッター
        <BottomNav /> */}
      </div>
    </div>
  );
}