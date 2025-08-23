import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function UsersList({ currentUser, handleApiError }) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [newRole, setNewRole] = useState("ROLE_USER");

  const navigate = useNavigate();

  // ユーザー一覧取得
  const fetchUsers = async () => {
    try {
      const res = await apiFetch("http://localhost:8080/users", { method: "GET" }, null, navigate);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      handleApiError?.(e, "ユーザー一覧の取得に失敗しました");
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPassword("");
  };
  const cancelEdit = () => setEditingUser(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // 新規作成
  const createUser = async () => {
    try {
      const res = await apiFetch(
        "http://localhost:8080/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: newUsername, email: newEmail, password: newPassword, role: newRole })
        },
        null,
        navigate
      );
      const user = await res.json();
      setUsers([...users, user]);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("ROLE_USER");
    } catch (e) {
      handleApiError?.(e, "ユーザー作成に失敗しました");
    }
  };

  // 編集保存
  const submitEdit = async () => {
    try {
      const res = await apiFetch(
        `http://localhost:8080/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: editUsername, email: editEmail, ...(editPassword ? { password: editPassword } : {}) })
        },
        null,
        navigate
      );
      const updatedUser = await res.json();
      setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      setEditingUser(null);
    } catch (e) {
      handleApiError?.(e, "ユーザー編集に失敗しました");
    }
  };

  // ユーザー削除
  const deleteUser = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      const res = await apiFetch(`http://localhost:8080/users/${id}`, { method: "DELETE" }, null, navigate);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      handleApiError?.(e, "ユーザー削除に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <h2 className="mb-5 text-xl text-[#D4B08C] font-semibold">ユーザー一覧</h2>
      {(currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN") && (
        <div className="mb-5 border border-gray-300 p-4 w-full max-w-lg rounded">
          <h3 className="text-lg text-[#D4B08C] font-semibold mb-3">新規ユーザー作成</h3>
          <div className="flex flex-col gap-2">
            <input
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
            />
            <input
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
            <input
              type="password"
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <select
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
            >
              <option value="ROLE_USER">USER</option>
              {(currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN") && <option value="ROLE_ADMIN">ADMIN</option>}
              {currentUser.role === "ROLE_SUPERADMIN" && <option value="ROLE_SUPERADMIN">SUPERADMIN</option>}
            </select>
            <button
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
              onClick={createUser}
            >
              作成
            </button>
          </div>
        </div>
      )}
      {editingUser && (
        <div className="mb-5 border border-gray-300 p-4 w-full max-w-lg rounded">
          <h3 className="text-lg text-[#D4B08C] font-semibold mb-3">ユーザー編集: {editingUser.username}</h3>
          <div className="flex flex-col gap-2">
            <input
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              className="border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="New Password"
            />
            <div className="flex gap-2">
              <button
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
                onClick={submitEdit}
              >
                保存
              </button>
              <button
                className="bg-gray-300 text-black p-2 rounded hover:bg-gray-400 transition"
                onClick={cancelEdit}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="table-auto border-collapse border mb-8">
        <thead className="bg-[#2A2A2A] text-[#D4B08C] font-semibold">
          <tr>
            <th className="border border-gray-400 p-2">ID</th>
            <th className="border border-gray-400 p-2">Username</th>
            <th className="border border-gray-400 p-2">Email</th>
            <th className="border border-gray-400 p-2">Role</th>
            <th className="border border-gray-400 p-2">Created At</th>
            <th className="border border-gray-400 p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border border-gray-400 p-2">{user.id}</td>
              <td className="border border-gray-400 p-2">{user.username}</td>
              <td className="border border-gray-400 p-2">{user.email}</td>
              <td className="border border-gray-400 p-2">{user.role}</td>
              <td className="border border-gray-400 p-2">{new Date(user.createdAt).toLocaleString()}</td>
              <td className="border border-gray-400 p-2">
                {(currentUser.role === "ROLE_SUPERADMIN" || currentUser.id === user.id) && (
                  <button className="mr-1 p-1 border rounded" onClick={() => startEditing(user)}>編集</button>
                )}
                {currentUser.role === "ROLE_SUPERADMIN" && (
                  <button className="p-1 border rounded" onClick={() => deleteUser(user.id)}>削除</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}