import React from "react";

export default function GlobalIndices() {
  return (
    <div className="bg-[#3A3A3A] p-4 rounded mb-4">
      <h2 className="text-[#D4B08C] font-semibold mb-2">世界の主要指数</h2>
      <div className="flex justify-between text-[#8A7A6A]">
        <div>日経225: 34,000</div>
        <div>NYダウ: 35,000</div>
        <div>NASDAQ: 15,000</div>
      </div>
    </div>
  );
}