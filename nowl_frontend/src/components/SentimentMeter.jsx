import React, { useEffect, useState } from "react";

export default function SentimentMeter({ className = "" }) {
  const [angle, setAngle] = useState(0); // 中立=0度, 強気=+45, 弱気=-45 とする

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8081/sentiment");
        const text = await res.text();  // JSONじゃなくて生のレスポンスを確認
        console.log("Raw response:", text);
        const data = JSON.parse(text);  // ここで落ちるなら内容がHTML
        setAngle(data.angle);
      } catch (err) {
        console.error("Failed to fetch sentiment:", err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className={`bg-[#3A3A3A] p-4 rounded relative h-[370px]`}>
      <h2 className="text-[#D4B08C] font-semibold mb-2">センチメントメーター</h2>
      <div
        className="absolute bottom-0 left-1/2 w-1 bg-[#D4B08C]"
        style={{
          height: "120px",
          transform: `translateX(-50%) rotate(${angle}deg)`,
          transformOrigin: "bottom center",
        }}
      ></div>
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-[#D4B08C] rounded-full transform -translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 text-base font-semibold text-red-400">
        弱気
      </div>
      <div className="absolute bottom-0 right-0 text-base font-semibold text-green-400">
        強気
      </div>
    </div>
  );
}