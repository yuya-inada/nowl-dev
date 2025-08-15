import React, { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // JWT 連動 currentUser
  const [currentUser, setCurrentUser] = useState({ id: null, username: "unknown", role: "ROLE_USER" });

  // ユーザー一覧取得
  const fetchUsers = () => {
    fetch("http://localhost:8080/users", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(e => console.error(e));
  };

  // JWT デコードして currentUser をセット
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token); // { sub: username, role: "ROLE_USER", id: 21, ... }
        setCurrentUser({
          id: decoded.id || null,
          username: decoded.sub || "unknown",
          role: decoded.role || "ROLE_USER"
        });
      } catch (e) {
        console.error("JWT decode error:", e);
      }
    }

    fetchUsers();
  }, []);

  // 新規ユーザー作成
  const createUser = () => {
    fetch("http://localhost:8080/users", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      },
      body: JSON.stringify({
        username: newUsername,
        email: newEmail,
        password: newPassword
      })
    })
      .then(res => res.json())
      .then(user => {
        setUsers([...users, user]);
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
      })
      .catch(e => console.error(e));
  };

  // 編集開始
  const startEditing = user => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPassword(""); // 新しいパスワードが入力されるまで空
  };

  const cancelEdit = () => setEditingUser(null);

  // 編集保存
  const submitEdit = () => {
    fetch(`http://localhost:8080/users/${editingUser.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      },
      body: JSON.stringify({
        username: editUsername,
        email: editEmail,
        password: editPassword ? editPassword : undefined
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(updatedUser => {
      setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      setEditingUser(null);
    })
    .catch(e => console.error("編集失敗:", e));
  };

  // ユーザー削除
  const deleteUser = id => {
    if (!window.confirm("本当に削除しますか？")) return;
    fetch(`http://localhost:8080/users/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      }
    })
      .then(res => {
        if (res.ok) {
          setUsers(users.filter(u => u.id !== id));
        } else {
          console.error("削除失敗");
        }
      })
      .catch(e => console.error(e));
  };

  return (
    <div>
      <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc", backgroundColor: "" }}>
        <strong>ログイン中ユーザー:</strong> {currentUser.username} ({currentUser.role})
      </div>

      <h2>ユーザー一覧</h2>

      {/* 新規作成フォーム */}
      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Username"
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
        />
        <input
          placeholder="Email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <button onClick={createUser}>作成</button>
      </div>

      {/* 編集フォーム */}
      {editingUser && (
        <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>ユーザー編集: {editingUser.username}</h3>
          <input
            value={editUsername}
            onChange={e => setEditUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={editPassword}
            onChange={e => setEditPassword(e.target.value)}
            placeholder="New Password"
          />
          <button onClick={submitEdit}>保存</button>
          <button onClick={cancelEdit}>キャンセル</button>
        </div>
      )}

      {/* ユーザー一覧テーブル */}
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created At</th>
            <th>操作</th>
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
                {/* 編集ボタン: SUPERADMIN は全員、ADMIN以上は自分のみ */}
                {((currentUser.role === "ROLE_SUPERADMIN") || 
                  (currentUser.role === "ROLE_ADMIN" && currentUser.id === user.id)) && (
                  <button onClick={() => startEditing(user)}>編集</button>
                )}
                {" "}
                {/* 削除ボタン: SUPERADMIN のみ */}
                {currentUser.role === "ROLE_SUPERADMIN" && (
                  <button onClick={() => deleteUser(user.id)}>削除</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}