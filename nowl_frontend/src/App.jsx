import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import UsersList from "./pages/UsersList";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import jwtDecode from "jwt-decode";

export default function App() {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // APIメッセージ取得
  useEffect(() => {
    fetch('http://localhost:8080/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch((e) => {
        console.error(e);
        setMessage('API取得エラー');
      });
  }, []);

  // ページロード時に JWT を確認して currentUser を設定
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // 有効期限チェック  （exp は秒単位なので　＊1000）
        if(decoded.exp * 1000 < Date.now()){
          console.warn("Token expired");
          localStorage.removeItem("jwt");
          setCurrentUser(null);
          return;
        }
        const role = decoded.role || "ROLE_USER";
        setCurrentUser({
          id: decoded.id || null,
          username: decoded.sub || "unknown",
          role: role,
        });
      } catch (e) {
        console.error("Invalid token");
        localStorage.removeItem("jwt");
        setCurrentUser(null);
      }
    }
  }, []);

  // ログアウト
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setCurrentUser(null);
  };

  // APIエラーやJWT期限切れなど共通の処理
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
      <div className="text-center">
        <nav style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ marginRight: "10px" }}>ホーム（フロント＆バック連携確認）　| </Link>
          <Link to="/dashboard" style={{ marginRight: "10px" }}>本番用ホーム画面　| </Link>
          <Link to="/users" style={{ marginRight: "10px" }}>ユーザー一覧　| </Link>
          {!currentUser && <Link to="/login">ログイン</Link>}
        </nav>
      

      {currentUser && (
        <div className="text-center" style={{ marginBottom: "20px" }}>
          ログイン中ユーザー: {currentUser.username} ({currentUser.role})
          <button onClick={handleLogout} style={{ marginLeft: "10px" }}>ログアウト</button>
        </div>
      )}

      <Routes>
        {/* ホーム */}
        <Route
          path="/"
          element={
            <div>
              <h1>Nowl Frontend</h1>
              <p>APIからのメッセージ: {message}</p>
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

        {/* ログイン後の遷移先：ホーム画面 */}
        <Route
          path="/dashboard"
          element={
            currentUser ? <Dashboard currentUser={currentUser} /> : <Navigate to="/login" />
          }
        />

        {/* それ以外はホームにリダイレクト */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
    </Router>
  );
}