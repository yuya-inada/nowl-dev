import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    agreeToTerms: false,
  });

  const [validation, setValidation] = useState({
    email: { valid: false, message: "" },
    password: { valid: false, message: "", strength: 0 },
    confirmPassword: { valid: false, message: "" },
    username: { valid: false, message: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // パスワード強度チェック
  const checkPasswordStrength = (password) => {
    let strength = 0;
    let message = "";

    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    switch (strength) {
      case 0:
      case 1:
        message = "弱い";
        break;
      case 2:
      case 3:
        message = "普通";
        break;
      case 4:
        message = "強い";
        break;
      case 5:
        message = "非常に強い";
        break;
      default:
        message = "弱い";
    }

    return { strength, message };
  };

  // 入力ハンドラー
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // リアルタイムバリデーション
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidation((prev) => ({
        ...prev,
        email: {
          valid: emailRegex.test(value),
          message: emailRegex.test(value)
            ? ""
            : "有効なメールアドレスを入力してください",
        },
      }));
    }

    if (field === "password") {
      const { strength, message } = checkPasswordStrength(value);
      setValidation((prev) => ({
        ...prev,
        password: { valid: strength >= 3, message, strength },
      }));
    }

    if (field === "confirmPassword") {
      setValidation((prev) => ({
        ...prev,
        confirmPassword: {
          valid: value === formData.password,
          message: value === formData.password ? "" : "パスワードが一致しません",
        },
      }));
    }

    if (field === "username") {
      setValidation((prev) => ({
        ...prev,
        username: {
          valid: value.length >= 2 && value.length <= 20,
          message:
            value.length >= 2 && value.length <= 20
              ? ""
              : "ユーザーネームは2-20文字で入力してください",
        },
      }));
    }
  };

  const PasswordStrengthBar = ({ strength }) => {
    const getColor = () => {
      if (strength <= 1) return "bg-red-500";
      if (strength <= 2) return "bg-yellow-500";
      if (strength <= 3) return "bg-blue-500";
      if (strength <= 4) return "bg-green-500";
      return "bg-green-600";
    };

    return (
      <div className="w-full bg-[#3A3A3A] rounded-full h-2 mt-1">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
    );
  };

  // アカウント作成　停止
  const handleRegister = () => {
    alert("Currently in development.");
  };

  // // アカウント作成機能
  // const handleRegister = async () => {
  //   // バリデーションチェック
  //   if (
  //     !validation.email.valid ||
  //     !validation.password.valid ||
  //     !validation.confirmPassword.valid ||
  //     !validation.username.valid ||
  //     !formData.agreeToTerms
  //   ) {
  //     alert("入力に不備があります。各項目を確認してください。");
  //     return;
  //   }
  
  //   try {
  //     const res = await fetch("http://localhost:8080/auth/register", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         username: formData.username,
  //         email: formData.email,
  //         password: formData.password,
  //       }),
  //     });
  
  //     if (!res.ok) {
  //       const errorText = await res.text();
  //       alert(errorText);
  //       return;
  //     }
  
  //     alert("アカウントを作成しました！");
  //     navigate("/login");
  //   } catch (err) {
  //     console.error(err);
  //     alert("登録中にエラーが発生しました");
  //   }
  // };

  return (
    <div className="max-w-md mx-auto mt-20 font-crimson">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h2 className="text-xl font-bold text-[#D4B08C] mb-6 text-center">
          新規アカウント作成
        </h2>

        <div className="space-y-4">
          {/* ユーザーネーム */}
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              ユーザーネーム
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className={`w-full px-3 py-2 bg-[#3A3A3A] border rounded text-[#D4B08C] focus:outline-none ${
                validation.username.valid
                  ? "border-green-500"
                  : formData.username && !validation.username.valid
                  ? "border-red-500"
                  : "border-[#4A4A4A]"
              }`}
              placeholder="表示名を入力"
            />
            {formData.username && !validation.username.valid && (
              <p className="text-red-400 text-xs mt-1">{validation.username.message}</p>
            )}
          </div>

          {/* メール */}
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-2 bg-[#3A3A3A] border rounded text-[#D4B08C] focus:outline-none ${
                validation.email.valid
                  ? "border-green-500"
                  : formData.email && !validation.email.valid
                  ? "border-red-500"
                  : "border-[#4A4A4A]"
              }`}
              placeholder="example@email.com"
            />
            {formData.email && !validation.email.valid && (
              <p className="text-red-400 text-xs mt-1">{validation.email.message}</p>
            )}
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">パスワード</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:outline-none pr-10"
                placeholder="8文字以上の強力なパスワード"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8A7A6A] hover:text-[#D4B08C]"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
            {formData.password && (
              <>
                <PasswordStrengthBar strength={validation.password.strength} />
                <p className="text-xs mt-1 text-[#8A7A6A]">{validation.password.message}</p>
              </>
            )}
          </div>

          {/* パスワード確認 */}
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">パスワード確認</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`w-full px-3 py-2 bg-[#3A3A3A] border rounded text-[#D4B08C] focus:outline-none pr-10 ${
                  validation.confirmPassword.valid
                    ? "border-green-500"
                    : formData.confirmPassword && !validation.confirmPassword.valid
                    ? "border-red-500"
                    : "border-[#4A4A4A]"
                }`}
                placeholder="パスワードを再入力"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8A7A6A] hover:text-[#D4B08C]"
              >
                <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
            {formData.confirmPassword && !validation.confirmPassword.valid && (
              <p className="text-red-400 text-xs mt-1">{validation.confirmPassword.message}</p>
            )}
          </div>

          {/* 利用規約 */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
              className="mt-1 w-4 h-4 text-[#8B4513] bg-[#3A3A3A] border-[#4A4A4A] rounded focus:ring-[#8B4513]"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-[#D4B08C]">
              <span className="text-[#8B4513] hover:text-[#A0522D] cursor-pointer">
                利用規約
              </span>{" "}
              および{" "}
              <span className="text-[#8B4513] hover:text-[#A0522D] cursor-pointer">
                プライバシーポリシー
              </span>{" "}
              に同意します
            </label>
          </div>

          {/* アカウント作成ボタン */}
          <button
            type="button"
            onClick={handleRegister}
            // disabled={
            //   !validation.email.valid ||
            //   !validation.password.valid ||
            //   !validation.confirmPassword.valid ||
            //   !validation.username.valid ||
            //   !formData.agreeToTerms
            // }
            className="w-full bg-[#8B4513] text-[#D4B08C] py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors disabled:bg-[#4A4A4A] disabled:text-[#8A7A6A] disabled:cursor-not-allowed"
          >
            アカウント作成
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#8B4513] hover:text-[#A0522D] text-sm"
            >
              既にアカウントをお持ちの方
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}