import React from "react";

export default function SentimentMeter() {
  return (
    <div className="bg-[#3A3A3A] p-4 rounded mb-4 relative h-64">
      <h2 className="text-[#D4B08C] font-semibold mb-2">センチメントメーター</h2>
      <div className="absolute bottom-0 left-1/2 w-1 bg-[#D4B08C] origin-bottom transform -translate-x-1/2" style={{ height: "120px", transform: "translateX(-50%) rotate(27deg)", transformOrigin: "bottom center" }}></div>
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-[#D4B08C] rounded-full transform -translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 text-base font-semibold text-red-400">弱気</div>
      <div className="absolute bottom-0 right-0 text-base font-semibold text-green-400">強気</div>
    </div>
  );
}