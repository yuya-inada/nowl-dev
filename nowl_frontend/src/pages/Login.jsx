// /src/pages/Login.jsx
import React, { useState } from "react";
import jwtDecode from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function Login({ setCurrentUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      const token = data.token; // { "token": "..." } 形式を想定
      localStorage.setItem("jwt", token); // UsersList.jsx　と App.jsx と名前統一

      const decoded = jwtDecode(token);
      const role = decoded.role || "ROLE_USER";
      setCurrentUser({
        id: decoded.id || null,
        username: decoded.sub || username,
        role: role,
      });

      // ログイン成功後にユーザー一覧へ遷移
      // navigate("/dashboard", { state: { role } });
      navigate("/dashboard", { state: { role } });
    } catch (err) {
      console.error(err);
      setError("ログインに失敗しました");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 font-crimson">
      <h2 className="text-xl mb-4">ログイン</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button
          type="submit"
          className="w-full py-2 bg-black text-white rounded-md hover:bg-gray-500"
        >
          ログイン
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}