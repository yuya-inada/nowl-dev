"use client";
import React from "react";

function MainComponent() {
  const [currentView, setCurrentView] = React.useState("login"); // login, register, verify, dashboard, security, notifications
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState(false);

  // フォームデータ
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "", // nickname から username に変更
    agreeToTerms: false,
    currentPassword: "",
    newPassword: "",
    tradingPassword: "",
    verificationCode: "",
  });

  // バリデーション状態
  const [validation, setValidation] = React.useState({
    email: { valid: false, message: "" },
    password: { valid: false, message: "", strength: 0 },
    confirmPassword: { valid: false, message: "" },
    username: { valid: false, message: "" }, // nickname から username に変更
  });

  // ログイン履歴データ
  const loginHistory = [
    {
      date: "2024/12/23 17:45",
      ip: "192.168.1.100",
      device: "Windows Chrome",
      location: "東京",
      status: "success",
    },
    {
      date: "2024/12/23 09:30",
      ip: "192.168.1.100",
      device: "Windows Chrome",
      location: "東京",
      status: "success",
    },
    {
      date: "2024/12/22 18:20",
      ip: "203.104.209.xxx",
      device: "iPhone Safari",
      location: "大阪",
      status: "failed",
    },
    {
      date: "2024/12/22 15:15",
      ip: "192.168.1.100",
      device: "Windows Chrome",
      location: "東京",
      status: "success",
    },
    {
      date: "2024/12/21 20:45",
      ip: "192.168.1.100",
      device: "Windows Chrome",
      location: "東京",
      status: "success",
    },
  ];

  // セキュリティ通知データ
  const securityNotifications = [
    {
      id: 1,
      type: "warning",
      title: "異常なログイン試行を検出",
      message: "大阪からの不正なログイン試行が検出されました。",
      date: "2024/12/22 18:20",
      read: false,
    },
    {
      id: 2,
      type: "info",
      title: "パスワード変更完了",
      message: "パスワードが正常に変更されました。",
      date: "2024/12/20 14:30",
      read: true,
    },
    {
      id: 3,
      type: "success",
      title: "2段階認証が有効化されました",
      message: "アカウントのセキュリティが強化されました。",
      date: "2024/12/19 10:15",
      read: true,
    },
  ];

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

  // フォーム入力ハンドラー
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
        password: {
          valid: strength >= 3,
          message: `パスワード強度: ${message}`,
          strength,
        },
      }));
    }

    if (field === "confirmPassword") {
      setValidation((prev) => ({
        ...prev,
        confirmPassword: {
          valid: value === formData.password,
          message:
            value === formData.password ? "" : "パスワードが一致しません",
        },
      }));
    }

    if (field === "username") {
      // nickname から username に変更
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

  // パスワード強度バー
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

  // ログイン画面
  const LoginView = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h2 className="text-xl font-bold text-[#D4B08C] mb-6 text-center">
          ログイン
        </h2>

        <div className="space-y-4">
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

          <button
            onClick={() => {
              setIsLoggedIn(true);
              setCurrentView("dashboard");
            }}
            className="w-full bg-[#8B4513] text-[#D4B08C] py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors"
          >
            ログイン
          </button>

          <div className="text-center space-y-2">
            <button
              onClick={() => setCurrentView("register")}
              className="text-[#8B4513] hover:text-[#A0522D] text-sm"
            >
              新規アカウント作成
            </button>
            <div>
              <button className="text-[#8A7A6A] hover:text-[#D4B08C] text-sm">
                パスワードを忘れた方
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 新規登録画面
  const RegisterView = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h2 className="text-xl font-bold text-[#D4B08C] mb-6 text-center">
          新規アカウント作成
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              ユーザーネーム
            </label>
            <input
              type="text"
              name="username"
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
              <p className="text-red-400 text-xs mt-1">
                {validation.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
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
              <p className="text-red-400 text-xs mt-1">
                {validation.email.message}
              </p>
            )}
          </div>

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
                placeholder="8文字以上の強力なパスワード"
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
            {formData.password && (
              <>
                <PasswordStrengthBar strength={validation.password.strength} />
                <p className="text-xs mt-1 text-[#8A7A6A]">
                  {validation.password.message}
                </p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              パスワード確認
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className={`w-full px-3 py-2 bg-[#3A3A3A] border rounded text-[#D4B08C] focus:outline-none pr-10 ${
                  validation.confirmPassword.valid
                    ? "border-green-500"
                    : formData.confirmPassword &&
                      !validation.confirmPassword.valid
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
                <i
                  className={`fas ${
                    showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                ></i>
              </button>
            </div>
            {formData.confirmPassword && !validation.confirmPassword.valid && (
              <p className="text-red-400 text-xs mt-1">
                {validation.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) =>
                handleInputChange("agreeToTerms", e.target.checked)
              }
              className="mt-1 w-4 h-4 text-[#8B4513] bg-[#3A3A3A] border-[#4A4A4A] rounded focus:ring-[#8B4513]"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-[#D4B08C]">
              <span className="text-[#8B4513] hover:text-[#A0522D] cursor-pointer">
                利用規約
              </span>
              および
              <span className="text-[#8B4513] hover:text-[#A0522D] cursor-pointer">
                プライバシーポリシー
              </span>
              に同意します
            </label>
          </div>

          <button
            onClick={() => setCurrentView("verify")}
            disabled={
              !validation.email.valid ||
              !validation.password.valid ||
              !validation.confirmPassword.valid ||
              !validation.username.valid ||
              !formData.agreeToTerms
            }
            className="w-full bg-[#8B4513] text-[#D4B08C] py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors disabled:bg-[#4A4A4A] disabled:text-[#8A7A6A] disabled:cursor-not-allowed"
          >
            アカウント作成
          </button>

          <div className="text-center">
            <button
              onClick={() => setCurrentView("login")}
              className="text-[#8B4513] hover:text-[#A0522D] text-sm"
            >
              既にアカウントをお持ちの方
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // メール認証画面
  const VerifyView = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <div className="text-center mb-6">
          <i className="fas fa-envelope text-4xl text-[#8B4513] mb-3"></i>
          <h2 className="text-xl font-bold text-[#D4B08C] mb-2">メール認証</h2>
          <p className="text-sm text-[#8A7A6A]">
            {formData.email} に認証コードを送信しました
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              認証コード
            </label>
            <input
              type="text"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={(e) =>
                handleInputChange("verificationCode", e.target.value)
              }
              className="w-full px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength="6"
            />
          </div>

          <button
            onClick={() => {
              setEmailVerified(true);
              setIsLoggedIn(true);
              setCurrentView("dashboard");
            }}
            className="w-full bg-[#8B4513] text-[#D4B08C] py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors"
          >
            認証する
          </button>

          <div className="text-center space-y-2">
            <button className="text-[#8A7A6A] hover:text-[#D4B08C] text-sm">
              認証コードを再送信
            </button>
            <div>
              <button
                onClick={() => setCurrentView("register")}
                className="text-[#8B4513] hover:text-[#A0522D] text-sm"
              >
                メールアドレスを変更
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ダッシュボード画面
  const DashboardView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* アカウント概要 */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h2 className="text-xl font-bold text-[#D4B08C] mb-4">
          アカウント概要
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#8A7A6A]">ユーザーネーム</span>
                <span className="text-[#D4B08C]">
                  {formData.username || "トレーダー"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7A6A]">メールアドレス</span>
                <span className="text-[#D4B08C]">
                  {formData.email || "user@example.com"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7A6A]">アカウント作成日</span>
                <span className="text-[#D4B08C]">2024/12/23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7A6A]">最終ログイン</span>
                <span className="text-[#D4B08C]">2024/12/23 17:45</span>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#8A7A6A]">メール認証</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    emailVerified
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {emailVerified ? "認証済み" : "未認証"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A7A6A]">2段階認証</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    twoFactorEnabled
                      ? "bg-green-600 text-white"
                      : "bg-yellow-600 text-black"
                  }`}
                >
                  {twoFactorEnabled ? "有効" : "無効"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A7A6A]">取引パスワード</span>
                <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                  設定済み
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A7A6A]">アカウント状態</span>
                <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                  アクティブ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView("security")}
          className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 hover:bg-[#3A3A3A] transition-colors"
        >
          <i className="fas fa-shield-alt text-2xl text-[#8B4513] mb-2"></i>
          <div className="text-[#D4B08C] font-semibold">セキュリティ設定</div>
          <div className="text-xs text-[#8A7A6A] mt-1">
            パスワード変更・2段階認証
          </div>
        </button>

        <button
          onClick={() => setCurrentView("notifications")}
          className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 hover:bg-[#3A3A3A] transition-colors"
        >
          <i className="fas fa-bell text-2xl text-[#8B4513] mb-2"></i>
          <div className="text-[#D4B08C] font-semibold">セキュリティ通知</div>
          <div className="text-xs text-[#8A7A6A] mt-1">
            ログイン履歴・通知設定
          </div>
        </button>

        <button className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 hover:bg-[#3A3A3A] transition-colors">
          <i className="fas fa-cog text-2xl text-[#8B4513] mb-2"></i>
          <div className="text-[#D4B08C] font-semibold">アカウント設定</div>
          <div className="text-xs text-[#8A7A6A] mt-1">
            プロフィール・通知設定
          </div>
        </button>
      </div>
    </div>
  );

  // セキュリティ設定画面
  const SecurityView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <button
          onClick={() => setCurrentView("dashboard")}
          className="text-[#8B4513] hover:text-[#A0522D]"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-[#D4B08C]">セキュリティ設定</h2>
      </div>

      {/* パスワード変更 */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-[#D4B08C] mb-4">
          パスワード変更
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              現在のパスワード
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                className="w-full px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none pr-10"
                placeholder="現在のパスワード"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8A7A6A] hover:text-[#D4B08C]"
              >
                <i
                  className={`fas ${
                    showCurrentPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                ></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#D4B08C] mb-2">
              新しいパスワード
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                className="w-full px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none pr-10"
                placeholder="新しいパスワード"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8A7A6A] hover:text-[#D4B08C]"
              >
                <i
                  className={`fas ${
                    showNewPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                ></i>
              </button>
            </div>
          </div>
        </div>
        <button className="mt-4 bg-[#8B4513] text-[#D4B08C] px-4 py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors">
          パスワードを変更
        </button>
      </div>

      {/* 2段階認証 */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-[#D4B08C] mb-4">2段階認証</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[#D4B08C] font-semibold">
              2段階認証を有効にする
            </div>
            <div className="text-sm text-[#8A7A6A]">
              ログイン時に追加の認証コードが必要になります
            </div>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              twoFactorEnabled ? "bg-[#8B4513]" : "bg-[#4A4A4A]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFactorEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {twoFactorEnabled && (
          <div className="bg-[#3A3A3A] border border-[#4A4A4A] rounded p-4">
            <div className="text-center mb-4">
              <div className="bg-white p-4 rounded inline-block mb-2">
                <div className="w-32 h-32 bg-black flex items-center justify-center text-white text-xs">
                  QRコード
                </div>
              </div>
              <div className="text-sm text-[#8A7A6A]">
                Google AuthenticatorアプリでこのQRコードをスキャンしてください
              </div>
            </div>
            <div className="text-center">
              <input
                type="text"
                placeholder="認証コードを入力"
                className="px-3 py-2 bg-[#2A2A2A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none text-center"
              />
              <button className="ml-2 bg-[#8B4513] text-[#D4B08C] px-4 py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors">
                確認
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 取引パスワード */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-[#D4B08C] mb-4">
          取引パスワード
        </h3>
        <div className="mb-4">
          <label className="block text-sm text-[#D4B08C] mb-2">
            取引パスワード（6桁の数字）
          </label>
          <input
            type="password"
            name="tradingPassword"
            value={formData.tradingPassword}
            onChange={(e) =>
              handleInputChange("tradingPassword", e.target.value)
            }
            className="w-full max-w-xs px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded text-[#D4B08C] focus:border-[#8B4513] focus:outline-none text-center"
            placeholder="000000"
            maxLength="6"
          />
        </div>
        <button className="bg-[#8B4513] text-[#D4B08C] px-4 py-2 rounded font-semibold hover:bg-[#A0522D] transition-colors">
          取引パスワードを設定
        </button>
      </div>

      {/* ログイン履歴 */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-[#D4B08C] mb-4">
          ログイン履歴
        </h3>
        <div className="space-y-2">
          {loginHistory.map((login, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-[#3A3A3A] last:border-b-0"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    login.status === "success" ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <div className="text-[#D4B08C] text-sm">{login.date}</div>
                  <div className="text-[#8A7A6A] text-xs">
                    {login.device} - {login.location}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#8A7A6A] text-xs">{login.ip}</div>
                <div
                  className={`text-xs ${
                    login.status === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {login.status === "success" ? "成功" : "失敗"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // セキュリティ通知画面
  const NotificationsView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <button
          onClick={() => setCurrentView("dashboard")}
          className="text-[#8B4513] hover:text-[#A0522D]"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-[#D4B08C]">セキュリティ通知</h2>
      </div>

      {/* 通知一覧 */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-[#D4B08C] mb-4">通知履歴</h3>
        <div className="space-y-3">
          {securityNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded border ${
                notification.read
                  ? "bg-[#3A3A3A] border-[#4A4A4A]"
                  : "bg-[#2A2A2A] border-[#8B4513]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <i
                    className={`fas ${
                      notification.type === "warning"
                        ? "fa-exclamation-triangle text-yellow-500"
                        : notification.type === "info"
                        ? "fa-info-circle text-blue-500"
                        : "fa-check-circle text-green-500"
                    } mt-1`}
                  ></i>
                  <div>
                    <div className="text-[#D4B08C] font-semibold">
                      {notification.title}
                    </div>
                    <div className="text-[#8A7A6A] text-sm mt-1">
                      {notification.message}
                    </div>
                    <div className="text-[#8A7A6A] text-xs mt-2">
                      {notification.date}
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-[#8B4513] rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* セキュリティポリシー */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-[#D4B08C] mb-4">
          セキュリティポリシー
        </h3>
        <div className="space-y-4 text-sm text-[#8A7A6A]">
          <div>
            <h4 className="text-[#D4B08C] font-semibold mb-2">
              パスワードポリシー
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>8文字以上の英数字記号を含む複雑なパスワード</li>
              <li>90日ごとのパスワード変更を推奨</li>
              <li>過去5回のパスワードは再利用不可</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#D4B08C] font-semibold mb-2">ログイン制限</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>5回連続ログイン失敗でアカウント一時ロック</li>
              <li>異常な地域からのアクセス時は追加認証</li>
              <li>30日間未使用アカウントは自動ロック</li>
            </ul>
          </div>
        </div>
      </div>

      {/* アカウント削除 */}
      <div className="bg-[#2A2A2A] border border-red-500 rounded shadow-xl p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4">
          アカウント削除
        </h3>
        <div className="text-sm text-[#8A7A6A] mb-4">
          アカウントを削除すると、すべてのデータが完全に削除され、復元できません。
          この操作は取り消すことができませんので、慎重にご検討ください。
        </div>
        <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-colors">
          アカウントを削除
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#D4B08C] font-hiragino-mincho flex flex-col">
      {/* ヘッダー */}
      {isLoggedIn ? (
        // ログイン後はホーム画面のヘッダーを表示
        <nav className="bg-[#2A2A2A] border-b border-[#3A3A3A] px-4 py-2 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-[#D4B08C] text-xl">
                <i className="fas fa-owl"></i>
              </div>
              <div className="text-xl font-bold text-[#D4B08C] tracking-wider">
                NOWL TERMINAL
              </div>
              <div className="text-xs text-[#8A7A6A] bg-[#3A3A3A] px-2 py-1 rounded">
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
              <div className="flex items-center space-x-4">
                <span className="text-[#D4B08C]">
                  {formData.username || "ユーザー"}さん
                </span>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setCurrentView("login");
                  }}
                  className="text-[#8A7A6A] hover:text-[#D4B08C] text-sm"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </nav>
      ) : (
        // ログイン前のヘッダー
        <nav className="bg-[#2A2A2A] border-b border-[#3A3A3A] px-4 py-3 shadow-2xl">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="text-[#D4B08C] text-xl">
                <i className="fas fa-owl"></i>
              </div>
              <div className="text-xl font-bold text-[#D4B08C] tracking-wider">
                NOWL ACCOUNT
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView("login")}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === "login"
                    ? "bg-[#8B4513] text-[#D4B08C]"
                    : "text-[#8A7A6A] hover:text-[#D4B08C]"
                }`}
              >
                ログイン
              </button>
              <button
                onClick={() => setCurrentView("register")}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === "register"
                    ? "bg-[#8B4513] text-[#D4B08C]"
                    : "text-[#8A7A6A] hover:text-[#D4B08C]"
                }`}
              >
                新規登録
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* メインコンテンツ */}
      <div
        className={`flex-1 ${
          !isLoggedIn &&
          (currentView === "login" ||
            currentView === "register" ||
            currentView === "verify")
            ? "flex items-center justify-center"
            : "py-8 px-4"
        }`}
      >
        {currentView === "login" && <LoginView />}
        {currentView === "register" && <RegisterView />}
        {currentView === "verify" && <VerifyView />}
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "security" && <SecurityView />}
        {currentView === "notifications" && <NotificationsView />}
      </div>

      {/* フッター */}
      <footer className="bg-[#2A2A2A] border-t border-[#3A3A3A] px-4 py-6 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              {/* ログイン画面・メール認証画面以外でのみ「NOWLターミナルに戻る」を表示 */}
              {currentView !== "login" && currentView !== "verify" && (
                <a
                  href="/"
                  className="text-[#8B4513] hover:text-[#A0522D] flex items-center space-x-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  <span>NOWLターミナルに戻る</span>
                </a>
              )}
              <button className="text-[#8A7A6A] hover:text-[#D4B08C]">
                サポート
              </button>
              <button className="text-[#8A7A6A] hover:text-[#D4B08C]">
                よくある質問
              </button>
            </div>
            <div className="text-xs text-[#8A7A6A]">
              NOWL ACCOUNT © 2025 - Secure Trading Platform
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainComponent;