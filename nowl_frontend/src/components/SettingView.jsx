// src/components/SettingView.jsx
import React from "react";

const SettingView = ({ formData, emailVerified, twoFactorEnabled, setCurrentView }) => (
  <div className="max-w-6xl mx-auto space-y-6">
    {/* アカウント概要 */}
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-6">
      <h2 className="text-xl font-bold text-[#D4B08C] mb-4">アカウント概要</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[#8A7A6A]">ユーザーネーム</span>
            <span className="text-[#D4B08C]">{formData?.username || "トレーダー"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8A7A6A]">メールアドレス</span>
            <span className="text-[#D4B08C]">{formData?.email || "user@example.com"}</span>
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
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[#8A7A6A]">メール認証</span>
            <span className={`px-2 py-1 rounded text-xs ${emailVerified ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
              {emailVerified ? "認証済み" : "未認証"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8A7A6A]">2段階認証</span>
            <span className={`px-2 py-1 rounded text-xs ${twoFactorEnabled ? "bg-green-600 text-white" : "bg-yellow-600 text-black"}`}>
              {twoFactorEnabled ? "有効" : "無効"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8A7A6A]">取引パスワード</span>
            <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">設定済み</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8A7A6A]">アカウント状態</span>
            <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">アクティブ</span>
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
        <div className="text-xs text-[#8A7A6A] mt-1">パスワード変更・2段階認証</div>
      </button>

      <button
        onClick={() => setCurrentView("notifications")}
        className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 hover:bg-[#3A3A3A] transition-colors"
      >
        <i className="fas fa-bell text-2xl text-[#8B4513] mb-2"></i>
        <div className="text-[#D4B08C] font-semibold">セキュリティ通知</div>
        <div className="text-xs text-[#8A7A6A] mt-1">ログイン履歴・通知設定</div>
      </button>

      <button className="bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-xl p-4 hover:bg-[#3A3A3A] transition-colors">
        <i className="fas fa-cog text-2xl text-[#8B4513] mb-2"></i>
        <div className="text-[#D4B08C] font-semibold">アカウント設定</div>
        <div className="text-xs text-[#8A7A6A] mt-1">プロフィール・通知設定</div>
      </button>
    </div>
  </div>
);

export default SettingView;