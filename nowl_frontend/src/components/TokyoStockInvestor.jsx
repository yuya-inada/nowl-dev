// /src/components/TokyoStockInvestor.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function TokyoStockInvestor( {currentUser} ) {
  const [investorTypeData, setInvestorTypeData] = useState([]);
  const [tokyoStockData, setTokyoStockData] = useState([]);
  const isAdmin =
    currentUser?.role === "ROLE_ADMIN" || currentUser?.role === "ROLE_SUPERADMIN";

  const investorLabels = {
    "Proprietary": "自己取引",
    "Brokerage": "委託取引",
    "Individuals": "個人投資家",
    "Foreigners": "海外投資家",
    "Securities Cos.": "証券会社",
    "Institutions": "法人",
    "Financials": "金融機関"
  };

  // 投資主体別売買動向
  useEffect(() => {
    fetch("http://localhost:8081/api/investor-flow")
      .then(res => res.json())
      .then(data => setInvestorTypeData(data))
      .catch(err => console.error("Error fetching investor flow:", err));
  }, []);

  // 東証定点観測
  useEffect(() => {
    fetch("http://localhost:8081/api/market-summary")
      .then(res => res.json())
      .then(data => setTokyoStockData(data))
      .catch(err => console.error("Error fetching market summary:", err));
  }, []);

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
                <div>前日比</div>
                <div>Prime売買代金</div>
              </div>
              {tokyoStockData.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-2 text-xs"
                >
                  <div className="text-[#8A7A6A]">{item.date}</div>
                  <div className="font-mono text-[#D4B08C]">{item.nikkei}</div>
                  <div
                    className={`font-mono ${
                      item.change.startsWith("+") ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {item.change}
                  </div>
                  <div className="font-mono text-[#D4B08C]">{item.buy_quo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右：投資主体別売買 */}
        <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl">
            <div className="bg-[#3A3A3A] px-4 py-2 border-b border-[#4A4A4A] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#D4B08C]">
                INVESTOR FLOW
              </h3>

              {/* 管理者以上のみ表示 */}
              {isAdmin && (
                <Link
                  to="/investor_flow/logs"
                  className="text-xs text-[#D4B08C] bg-[#4A4A4A] px-2 py-1 rounded hover:bg-[#5A5A5A]"
                >
                  Investor Flow Logs
                </Link>
              )}
            </div>
          <div className="p-3">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs text-[#8A7A6A] font-semibold border-b border-[#3A3A3A] pb-1">
                <div>投資主体</div>
                <div>株式2市場合計</div>
                <div>現物＋先物</div>
              </div>
              {investorTypeData.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-[#D4B08C]">
                    {investorLabels[item.investor_type] || item.investor_type}
                  </div>
                  <div className={`font-mono ${item.market_2 >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {item.market_2 >= 0 ? `+${item.market_2.toLocaleString()}` : item.market_2.toLocaleString()}
                  </div>
                  <div className={`font-mono ${item.real_deli >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {item.real_deli >= 0 ? `+${item.real_deli.toLocaleString()}` : item.real_deli.toLocaleString()}
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