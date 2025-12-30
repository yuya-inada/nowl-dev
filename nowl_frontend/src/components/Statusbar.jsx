import React from "react";

export default function Statusbar() {
  return (
    <div className="space-y-2 py-4">
      {/* ④ システム情報 */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl mb-4">
        <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A]">
          <h2 className="text-sm font-bold text-[#D4B08C] tracking-wide">
            SYSTEM STATUS
          </h2>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-6 gap-4 text-xs">
            <div>
              <div className="text-[#8A7A6A]">MARKET STATUS</div>
              <div className="text-green-400 font-semibold">OPEN</div>
            </div>
            <div>
              <div className="text-[#8A7A6A]">DATA DELAY</div>
              <div className="text-green-400 font-semibold">REAL-TIME</div>
            </div>
            <div>
              <div className="text-[#8A7A6A]">CONNECTION</div>
              <div className="text-green-400 font-semibold">STABLE</div>
            </div>
            <div>
              <div className="text-[#8A7A6A]">CPU USAGE</div>
              <div className="text-[#D4B08C] font-mono">12%</div>
            </div>
            <div>
              <div className="text-[#8A7A6A]">MEMORY</div>
              <div className="text-[#D4B08C] font-mono">2.1GB</div>
            </div>
            <div>
              <div className="text-[#8A7A6A]">LATENCY</div>
              <div className="text-[#D4B08C] font-mono">125ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* ステータスバー */}
      <div className="bg-[#2A2A2A] border-t border-[#3A3A3A] px-4 py-1 text-xs text-[#8A7A6A] flex justify-between items-center">
        <div>NOWL TERMINAL © 2025 - Professional Trading Platform</div>
        <div className="text-[#D4B08C]">
          JST 17:45:32 | LAST UPDATE: REAL-TIME
        </div>
      </div>
    </div>
  );
}