import React from "react";

// Nowl統合提案
const nowlAdvice = {
  opportunities: [
    {
      title: "米国債利回り急騰",
      impact: "HIGH",
      suggestion: "金利敏感株の売り検討",
      time: "16:30",
    },
    {
      title: "円安進行継続",
      impact: "HIGH",
      suggestion: "輸出株の買い機会",
      time: "15:45",
    },
    {
      title: "テスラ決算下振れ",
      impact: "MEDIUM",
      suggestion: "EV関連株調整局面",
      time: "14:20",
    },
  ],
  weeklyAdvice:
    "今週はリスク抑制を推奨。米雇用統計とFOMC議事録に注意。ポジション縮小を検討してください。",
};

export default function Nowlproposals() {
  return (
    <>
    {/* ② Nowl統合提案 */}
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
      <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A]">
        <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide flex items-center">
          <i className="fas fa-owl mr-2 text-[#8B4513]"></i>
          NOWL AI - INTEGRATED ADVICE
        </h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 左側：取引機会 */}
          <div>
            <h3 className="text-sm font-semibold text-[#D4B08C] mb-3">
              取引機会
            </h3>
            <div className="space-y-2">
              {nowlAdvice.opportunities.map((opp, index) => (
                <div
                  key={index}
                  className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-2"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        opp.impact === "HIGH"
                          ? "bg-red-600 text-white"
                          : "bg-yellow-600 text-black"
                      }`}
                    >
                      {opp.impact}
                    </span>
                    <span className="text-xs text-[#8A7A6A]">
                      {opp.time}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#D4B08C] mb-1">
                    {opp.title}
                  </div>
                  <div className="text-xs text-[#8B4513]">
                    {opp.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側：週次助言 */}
          <div>
            <h3 className="text-sm font-semibold text-[#D4B08C] mb-3">
              週次助言
            </h3>
            <div className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-3">
              <p className="text-sm text-[#D4B08C] leading-relaxed">
                {nowlAdvice.weeklyAdvice}
              </p>
              <button className="mt-3 text-xs bg-[#8B4513] text-[#D4B08C] px-3 py-1 rounded hover:bg-[#A0522D]">
                詳細分析を見る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}