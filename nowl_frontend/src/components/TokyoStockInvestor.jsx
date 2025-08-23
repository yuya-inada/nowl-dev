// /src/components/TokyoStockInvestor.jsx
import React from "react";

export default function TokyoStockInvestor({ tokyoStockData, investorTypeData }) {
  return (
    <div className="col-span-8 space-y-4">
      {/* 東証定点観測表（左）と投資主体別売買（右）の横並び */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左：東証定点観測表 */}
        <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
          <div className="bg-[#3A3A3A] px-3 py-2 border-b border-[#4A4A4A]">
            <h3 className="text-sm font-bold text-[#D4B08C]">
              TOKYO STOCK HISTORY
            </h3>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xs text-[#8A7A6A] font-semibold border-b border-[#3A3A3A] pb-1">
                <div>日付</div>
                <div>日経平均</div>
                <div>TOPIX</div>
                <div>前日比</div>
              </div>
              {tokyoStockData.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-2 text-xs"
                >
                  <div className="text-[#8A7A6A]">{item.date}</div>
                  <div className="font-mono text-[#D4B08C]">{item.nikkei}</div>
                  <div className="font-mono text-[#D4B08C]">{item.topix}</div>
                  <div
                    className={`font-mono ${
                      item.change.startsWith("+") ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {item.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右：投資主体別売買 */}
        <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
          <div className="bg-[#3A3A3A] px-3 py-2 border-b border-[#4A4A4A]">
            <h3 className="text-sm font-bold text-[#D4B08C]">
              INVESTOR FLOW
            </h3>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xs text-[#8A7A6A] font-semibold border-b border-[#3A3A3A] pb-1">
                <div>主体</div>
                <div>買い</div>
                <div>売り</div>
                <div>差引</div>
              </div>
              {investorTypeData.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-2 text-xs"
                >
                  <div className="text-[#D4B08C]">{item.type}</div>
                  <div className="font-mono text-green-400">{item.buy}</div>
                  <div className="font-mono text-red-400">{item.sell}</div>
                  <div
                    className={`font-mono font-semibold ${
                      item.net.startsWith("+") ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {item.net}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}