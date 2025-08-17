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
    <div>
      <h2>ユーザー一覧</h2>

      {(currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN") && (
        <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>新規ユーザー作成</h3>
          <input placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
          <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <select value={newRole} onChange={e => setNewRole(e.target.value)}>
            <option value="ROLE_USER">USER</option>
            {(currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN") && <option value="ROLE_ADMIN">ADMIN</option>}
            {currentUser.role === "ROLE_SUPERADMIN" && <option value="ROLE_SUPERADMIN">SUPERADMIN</option>}
          </select>
          <button onClick={createUser}>作成</button>
        </div>
      )}

      {editingUser && (
        <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>ユーザー編集: {editingUser.username}</h3>
          <input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Username" />
          <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="New Password" />
          <button onClick={submitEdit}>保存</button>
          <button onClick={cancelEdit}>キャンセル</button>
        </div>
      )}

      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Created At</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleString()}</td>
              <td>
                {(currentUser.role === "ROLE_SUPERADMIN" || currentUser.id === user.id) && <button onClick={() => startEditing(user)}>編集</button>}
                {" "}
                {currentUser.role === "ROLE_SUPERADMIN" && <button onClick={() => deleteUser(user.id)}>削除</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}