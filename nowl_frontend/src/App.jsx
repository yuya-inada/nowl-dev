import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import UsersList from "./pages/UsersList";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import jwtDecode from "jwt-decode";
import SettingView from "./components/SettingView";
import TopNav from "./components/TopNav";

export default function App() {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // APIメッセージ取得
  useEffect(() => {
    fetch('http://localhost:8080/')
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

          {/* 設定画面（★これを追加） */}
          <Route
            path="/settings"
            element={currentUser ? (
              <>
                <TopNav
                  currentUser={currentUser}
                  emailVerified={true}
                  twoFactorEnabled={false}
                  setCurrentView={() => {}}
                />
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

          {/* その他はホームにリダイレクト */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}