import React, { useState } from "react";
import jwtDecode from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function Login({ setCurrentUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.email, // ← バックエンド側が username を使ってるため
          password: formData.password,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const token = data.token;
      localStorage.setItem("jwt", token);

      const decoded = jwtDecode(token);
      const role = decoded.role || "ROLE_USER";
      setCurrentUser({
        id: decoded.id || null,
        username: decoded.sub || formData.email,
        role,
      });

      navigate("/dashboard", { state: { role } });
    } catch (err) {
      console.error("Login failed:", err);
      setError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 font-crimson">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h2 className="text-xl font-bold text-[#D4B08C] mb-6 text-center">
          ログイン
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* メールアドレス */}
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none"
              placeholder="example@email.com"
            />
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none pr-10"
                placeholder="パスワードを入力"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8A7A6A] hover:text-[#D4B08C]"
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            className="w-full bg-[#8B4513] text-[#D4B08C] py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors"
          >
            ログイン
          </button>

          {/* エラーメッセージ */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* リンク群 */}
          <div className="text-center space-y-2 mt-4">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-[#8B4513] hover:text-[#A0522D] text-sm"
            >
              新規アカウント作成
            </button>
            <div>
              <button
                type="button"
                className="text-[#8A7A6A] hover:text-[#D4B08C] text-sm"
              >
                パスワードを忘れた方
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}