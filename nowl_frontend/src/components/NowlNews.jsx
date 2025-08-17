import React from "react";

export default function NowlNews({ nowlAdvice }) {
  return (
    <div className="bg-[#3A3A3A] p-4 rounded mb-4">
      <h2 className="text-[#D4B08C] font-semibold mb-2">Nowl注目速報</h2>
      {nowlAdvice.opportunities.map((opp, index) => (
        <div key={index} className="mb-2 p-2 border border-[#4A4A4A] rounded">
          <div className="text-xs text-[#8A7A6A]">{opp.time}</div>
          <div className="text-sm font-semibold text-[#D4B08C]">{opp.title}</div>
          <div className="text-xs text-[#8B4513]">{opp.suggestion}</div>
        </div>
      ))}
      <div className="text-xs mt-2 text-[#D4B08C]">{nowlAdvice.weeklyAdvice}</div>
    </div>
  );
}