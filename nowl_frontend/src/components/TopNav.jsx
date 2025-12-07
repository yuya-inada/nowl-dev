// src/components/TopNav.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TopNav({ currentUser, emailVerified, twoFactorEnabled, setCurrentView }) {
  console.log("currentUser:", currentUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTerminal, setActiveTerminal] = useState("HOME");
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 現在のURLに応じて activeTerminal を更新
  useEffect(() => {
    if (location.pathname === "/dashboard") setActiveTerminal("HOME");
    else if (location.pathname === "/settings") setActiveTerminal("SETTINGS");
    else setActiveTerminal(""); // それ以外のページ
  }, [location]);

  const terminalFunctions = [
    { code: "HOME" },
    { code: "MARKETS"},
    { code: "Main Index"},
    { code: "Fixed-Point"},
    { code: "Observation"},
    { code: "By Entity"},
    { code: "Supply and Demand"},
    { code: "PROPOSALS" },
    { code: "My-Portfolio" },
    { code: "SETTINGS" },
  ];
  // 現在の日付を取得（例として固定）
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekday = weekdays[today.getDay()];
    return `${year}/${month}/${day} (${weekday})`;
  };

  const menuItems = [
    "マーケット",
    "取引画面",
    "資産管理",
    "戦略提案",
    "目標設定、進捗管理",
    "Nowl相談",
    "学習傾向分析",
    "お知らせ",
    "設定",
  ];

  const adminMenuItems = [
    "Nowlロジック管理",
    "システム設定、障害管理",
    "ログ分析",
  ];

  return (
    <nav className="w-full bg-[#2A2A2A] border-b border-[#3A3A3A] px-4 py-2 shadow-2xl fixed top-0 left-0 right-0 z-50 font-hiragino-mincho text-[#D4B08C]">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-xl">
            <i className="fas fa-owl"></i>
          </div>
          <div className="text-3xl font-crimson tracking-wider">
            NOWL TERMINAL
          </div>
          <div className="text-xs text-[#8A7A6A] bg-[#3A3A3A] px-4 py-1 rounded">
            v2.1.5
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs text-[#8A7A6A]">JST 17:45:32</div>
          <button className="p-1 hover:bg-[#3A3A3A] rounded text-[#8A7A6A]">
            <i className="fas fa-search text-sm"></i>
          </button>
          <button className="p-1 hover:bg-[#3A3A3A] rounded text-[#8A7A6A] relative">
            <i className="fas fa-bell text-sm"></i>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 hover:bg-[#3A3A3A] rounded text-[#8A7A6A]"
          >
            <i className="fas fa-bars text-sm"></i>
          </button>
        </div>
      </div>

      {/* ターミナルバー */}
      <div className="flex items-center space-x-1 mt-2 border-t border-[#3A3A3A] pt-2">
        {terminalFunctions.map((func, index) => (
          <button
            key={index}
            onClick={() => {
              if (func.code === "HOME") navigate("/dashboard");
              if (func.code === "SETTINGS") navigate("/settings");
              setActiveTerminal(func.code);
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeTerminal === func.code
                ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                : "bg-[#3A3A3A] text-[#8A7A6A] hover:bg-[#4A4A4A]"
            }`}
          >
            {func.code}
          </button>
        ))}
        {(currentUser?.role === "ROLE_ADMIN" || currentUser?.role === "ROLE_SUPERADMIN") && (
          <button
            onClick={() => navigate("/admin/logs")}
            className="ml-2 px-3 py-1 text-xs rounded bg-[#5A3B1E] hover:bg-[#6A4A28] text-[#D4B08C] font-semibold"
          >
            Supply Logs
          </button>
        )}
      </div>

      {/* メニュー */}
      {isMenuOpen && (
        <div className="absolute top-16 right-4 bg-[#2A2A2A] text-[#D4B08C] rounded p-4 shadow-lg">
          <p>メニュー項目１</p>
          <p>メニュー項目２</p>
        </div>
      )}
    </nav>
  );
}