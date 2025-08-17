import React, { useState } from "react";
import TopNav from "./TopNav";
import CompositeChart from "./CompositeChart";
import GlobalIndices from "./GlobalIndices";
import EconomicCalendar from "./EconomicCalendar";
import NowlNews from "./NowlNews";
import SentimentMeter from "./SentimentMeter";
import BottomNav from "./BottomNav";

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

  // const UserDashboard = () => {
    return (
      <div>
        <h1>Welcome, User!</h1>
        <p>Here is your personal dashboard.</p>


        {/* ユーザー向けのコンポーネントやデータ表示 */}
        <div className="bg-[#1C1C1C] min-h-screen p-4">
          <TopNav />
          <CompositeChart />
          <GlobalIndices />
          <SentimentMeter />
          <EconomicCalendar calendarView={calendarView} setCalendarView={setCalendarView} />
          <NowlNews nowlAdvice={nowlAdvice} />
          <BottomNav />
        </div>
      </div>
    );
  };