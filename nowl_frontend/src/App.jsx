import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import UsersList from "./pages/UsersList";

export default function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/')  // ← ポート8000ではなく8080
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch((e) => {
        console.error(e);
        setMessage('API取得エラー');
      });
  }, []);

  return (
    <Router>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/" style={{ marginRight: "10px" }}>ホーム</Link>
        <Link to="/users">ユーザー一覧</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>Nowl Frontend</h1>
              <p>APIからのメッセージ: {message}</p>
            </div>
          }
        />
        <Route path="/users" element={<UsersList />} />
      </Routes>
    </Router>
  );
}