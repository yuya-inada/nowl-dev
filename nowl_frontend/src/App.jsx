import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import UsersList from "./pages/UsersList";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import jwtDecode from "jwt-decode";
import SettingView from "./components/SettingView";
import TopNav from "./components/TopNav";
import Register from "./pages/Register";
import EconomicCalendar from "./components/EconomicCalendar";
import LogsEconomicCalendar from "./components/Logs_economic_calendar";
import LogsEconomicEvent from "./components/Logs_economic_event";
import MarketDataLogs from "./components/Market_data_logs";
import InvestorFlowLogs from "./components/Investor_flow_logs";
import SupplyAdminLogs from "./pages/Supply_Admin_Logs";
import NowlAiAnalysis from "./pages/NowlAiAnalysis";
import MorningBriefPage from "./pages/MorningBriefPage";

export default function App() {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // APIメッセージ取得
  useEffect(() => {
    fetch('http://localhost:8091/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('API取得エラー'));
  }, []);

  // JWT確認
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if(decoded.exp * 1000 < Date.now()){
          localStorage.removeItem("jwt");
          setCurrentUser(null);
          return;
        }
        setCurrentUser({
          id: decoded.id || null,
          username: decoded.sub || "unknown",
          role: decoded.role || "ROLE_USER",
        });
      } catch {
        localStorage.removeItem("jwt");
        setCurrentUser(null);
      }
    }
  }, []);

  // 設定画面用のユーザーデータの取得
  useEffect(() => {
    if(currentUser?.id) {
      const token = localStorage.getItem("jwt"); // JWT取得
      fetch(`http://localhost:8080/users/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`, // ヘッダーにJWTを付与
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => setCurrentUser(data))
        .catch(err => console.error("ユーザー情報取得エラー:", err));
    }
  }, [currentUser?.id]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setCurrentUser(null);
  };

  const handleApiError = (error, customMessage) => {
    console.error(error);
    if (error.message === "TOKEN_EXPIRED") {
      alert("ログイン期限が切れました。再度ログインしてください。");
      localStorage.removeItem("jwt");
      setCurrentUser(null);
    } else {
      alert(customMessage || "サーバーエラーが発生しました");
    }
  };

  return (
    <Router>
      {/* ✅ ログイン済みなら全ページ共通で表示 */}
      {currentUser && (
        <TopNav
          currentUser={currentUser}
          emailVerified={true}
          twoFactorEnabled={false}
          setCurrentView={() => {}}
        />
      )}
      <div className="text-center mt-32 font-crimson px-4">
        <div className="inline-block border p-4 rounded">
          {/* ナビゲーション */}
          <nav className="mb-6">
            <Link to="/" className="mr-4 text-white underline">ホーム (フロント＆バック連携確認)</Link>
            <Link to="/dashboard" className="mr-4 text-white underline">本番用ホーム画面</Link>
            <Link to="/users" className="mr-4 text-white underline">ユーザー一覧</Link>
            {!currentUser && <Link to="/login" className="text-white underline">ログイン</Link>}
          </nav>
          {/* ログイン中ユーザー表示 */}
          {currentUser && (
            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-2">
              <span>ログイン中ユーザー: <strong>{currentUser.username}</strong> ({currentUser.role})</span>
              <button
                onClick={handleLogout}
                className="ml-0 sm:ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        {/* ルーティング */}
        <Routes>
          {/* ホーム */}
          <Route
            path="/"
            element={
              <div className="p-4 mt-4 text-[#D4B08C] border rounded max-w-2xl mx-auto shadow font-crimson">
                <h1 className="text-5xl mb-3">Nowl Frontend</h1>
                <p className="text-2xl">API (Backend) からのメッセージ: {message}</p>
              </div>
            }
          />

          {/* ユーザー一覧 (ログイン必須) */}
          <Route
            path="/users"
            element={
              currentUser ? <UsersList currentUser={currentUser} handleApiError={handleApiError}/> : <Navigate to="/login" />
            }
          />

          {/* ログイン画面 */}
          <Route
            path="/login"
            element={<Login setCurrentUser={setCurrentUser} />}
          />

          {/* ダッシュボード */}
          <Route
            path="/dashboard"
            element={currentUser ? <Dashboard currentUser={currentUser} /> : <Navigate to="/login" />}
          />

          {/* 設定画面 */}
          <Route
            path="/settings"
            element={currentUser ? (
              <>
                <div className="mt-20 px-4">
                  <SettingView
                    formData={currentUser}
                    emailVerified={true}
                    twoFactorEnabled={false}
                    setCurrentView={() => {}}
                  />
                </div>
              </>
            ) : (
              <Navigate to="/login" />
            )}
          />

          {/* 🔹 新規登録画面 */}
          <Route path="/register" element={<Register />} />

          {/* 経済カレンダー */}
          <Route path="/calendar" element={<EconomicCalendar />} />
          <Route path="/calendar/logs" element={<LogsEconomicCalendar />} />

          <Route
            path="/logs-economic-event"
            element={
              currentUser && (currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN")
                ? <LogsEconomicEvent />
                : <Navigate to="/" />
            }
          />
          
          {/* Market Data Logs（管理者以上のみアクセス可） */}
          <Route
            path="/market-data-logs"
            element={
              currentUser && (currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN")
                ? <MarketDataLogs />
                : <Navigate to="/" />
            }
          />

          {/* 主体別売買動向　ログ画面 （管理者以上のみアクセス可）　*/}
          <Route
            path="/investor_flow/logs"
            element={
              currentUser && (currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN")
                ? <InvestorFlowLogs />
                : <Navigate to="/" />
            }
          />
          

          {/* 全体需給指標テーブル　ログ画面 */}
          <Route path="/admin/logs" element={<SupplyAdminLogs />} />

          <Route
            path="/ai/analysis"
            element={
              currentUser && (currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN")
                ? <NowlAiAnalysis currentUser={currentUser} />
                : <Navigate to="/" />
            }
          />

          <Route
            path="/admin/ai"
            element={
              currentUser &&
              (currentUser.role === "ROLE_ADMIN" ||
              currentUser.role === "ROLE_SUPERADMIN")
                ? <NowlAiAnalysis />
                : <Navigate to="/" />
            }
          />

          <Route
            path="/admin/morning-brief"
            element={
              currentUser && (currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN")
                ? <MorningBriefPage currentUser={currentUser} />
                : <Navigate to="/" />
            }
          />

          {/* その他はホームにリダイレクト */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}