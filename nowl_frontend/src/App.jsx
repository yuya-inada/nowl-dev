import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import UsersList from "./pages/UsersList";
import Login from "./pages/Login";
import * as jwtDecode from "jwt-decode";

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
        setCurrentUser({ id: decoded.id, username: decoded.username, role: decoded.role });
      } catch (e) {
        console.error("Invalid token");
        localStorage.removeItem("jwt");
      }
    }
  }, []);

  // ログアウト
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setCurrentUser(null);
  };

  return (
    <Router>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/" style={{ marginRight: "10px" }}>ホーム</Link>
        <Link to="/users" style={{ marginRight: "10px" }}>ユーザー一覧</Link>
        {!currentUser && <Link to="/login">ログイン</Link>}
      </nav>

      {currentUser && (
        <div style={{ marginBottom: "20px" }}>
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
            currentUser ? <UsersList currentUser={currentUser} /> : <Navigate to="/login" />
          }
        />

        {/* ログイン画面 */}
        <Route
          path="/login"
          element={<Login setCurrentUser={setCurrentUser} />}
        />

        {/* それ以外はホームにリダイレクト */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}