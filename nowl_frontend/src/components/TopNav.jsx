// /src/components/TopNav.jsx
import React from "react";

export default function TopNav() {
  return (
    <div className="w-full">
      {/* 上段：横並び */}
      <div className="w-full bg-[#2A2A2A] rounded mb-4 flex justify-between items-center">
        <h1 className="text-[#D4B08C] font-bold text-lg">Nowl Dashboard</h1>
        <div className="text-sm text-[#8A7A6A]">ユーザー名</div>
      </div>

      {/* 下段：テスト */}
      <div className="w-full pl-6">
        テスト
      </div>
    </div>
  );
}