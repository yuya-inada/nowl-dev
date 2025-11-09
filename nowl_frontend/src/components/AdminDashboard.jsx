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

export default function AdminDashboard({ currentUser }) {  // ← propsで受け取る
  const [calendarView, setCalendarView] = useState("TODAY");

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] font-hiragino-mincho">
      <TopNav />

      <div className="pt-[10px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">Welcome, Admin!</h1>
        <p className="mb-6">Here you can manage users and system settings.</p>

        <div className="space-y-6">
          <CompositeChart currentUser={currentUser} />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <GlobalIndices />
            </div>
            <div className="col-span-8 space-y-4">
              <TokyoStockInvestor/>
              <SentimentMeter />
            </div>
          </div>
          <Nowlproposals/>
          {/* currentUser を props で受け取っているのでここで参照可能 */}
          <EconomicCalendar currentUser={currentUser} />
          <EconomicEventsList currentUser={currentUser} />
        </div>

        <Statusbar />
      </div>
    </div>
  );
}