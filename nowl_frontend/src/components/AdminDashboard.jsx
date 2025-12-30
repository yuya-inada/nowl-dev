import React, { useState } from "react";
import TopNav from "./TopNav";
import CompositeChart from "./CompositeChart";
import GlobalIndices from "./GlobalIndices";
import EconomicCalendar from "./EconomicCalendar";
import SentimentMeter from "./SentimentMeter";
import BottomNav from "./BottomNav";
import TokyoStockInvestor from "./TokyoStockInvestor";
import Statusbar from "./Statusbar";
import { EconomicEventsList } from "./EconomicEventsList";
import Nowlproposals from "./Nowlproposals";
import { Link } from "react-router-dom";

export default function AdminDashboard({ currentUser }) {
  const [calendarView, setCalendarView] = useState("TODAY");

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] font-hiragino-mincho">
      <div className="pt-[10px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">Welcome, Admin!</h1>
        <p className="mb-6">Here you can manage users and system settings.</p>

        <div className="flex gap-3 mb-6">
          <Link
            to="/admin/morning-brief"
            className="px-3 py-2 text-sm bg-[#203020] border border-green-500 rounded hover:bg-[#284028]"
          >
            🦉 Morning Brief
          </Link>

          <Link
            to="/ai/analysis"
            className="px-3 py-2 text-sm bg-[#202030] border border-blue-500 rounded"
          >
            🤖 AI Analysis
          </Link>
        </div>

        <div className="space-y-6">
          <CompositeChart currentUser={currentUser} />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <GlobalIndices />
            </div>
            <div className="col-span-8 space-y-4">
              <TokyoStockInvestor currentUser={currentUser} />
              <SentimentMeter />
            </div>
          </div>

          {/* 👇 currentUser を渡すように変更 */}
          <Nowlproposals currentUser={currentUser} />

          <EconomicCalendar currentUser={currentUser} />
          <EconomicEventsList currentUser={currentUser} />
        </div>

        <Statusbar />
      </div>
    </div>
  );
}