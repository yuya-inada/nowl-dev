import React, { useEffect, useState } from "react";

export default function GlobalIndices({ className = "" }) {
  const [indices, setIndices] = useState([]);

  useEffect(() => {
    async function fetchAllIndices() {
      try {
        const res = await fetch("http://localhost:8081/market-index-latest"); // 新API
        const data = await res.json();
        setIndices(data); // data = [{name, value, change, rate}, ...]
      } catch (err) {
        console.error("Failed to fetch indices", err);
      }
    }
    fetchAllIndices();
  }, []);

  return (
    <div className={`w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl ${className}`}>
      {/* ヘッダー */}
      <div className="bg-[#3A3A3A] px-3 py-2 border-b border-[#4A4A4A]">
        <h3 className="text-sm font-bold text-[#D4B08C]">GLOBAL INDICES</h3>
      </div>

      {/* コンテンツ */}
      <div className="p-3 space-y-1 h-[600px] overflow-y-auto">
        {indices.map((item, index) => (
          <div
            key={index}
            className="flex items-center py-1 border-b border-[#3A3A3A] last:border-b-0"
          >
            <div className="text-base font-semibold text-[#D4B08C] min-w-[110px]">
              {item.name}
            </div>

            <div className="text-right ml-auto">
              <div className="text-xs font-mono text-[#D4B08C]">{item.value}</div>
              <div className={`text-xs font-mono ${item.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                {item.change} ({item.rate})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}