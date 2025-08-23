// src/components/TopNav.jsx
import React, { useState } from "react";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTerminal, setActiveTerminal] = useState("HOME");

  const terminalFunctions = [
    { code: "HOME" },
    { code: "NEWS" },
    { code: "STOCKS" },
    { code: "SETTINGS" },
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
            onClick={() => setActiveTerminal(func.code)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeTerminal === func.code
                ? "bg-[#8B4513] text-[#D4B08C] font-semibold"
                : "bg-[#3A3A3A] text-[#8A7A6A] hover:bg-[#4A4A4A]"
            }`}
          >
            {func.code}
          </button>
        ))}
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