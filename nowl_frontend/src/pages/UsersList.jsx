import React, { useEffect, useState } from "react";
import axios from "axios";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8080/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setError("ユーザー一覧を取得できませんでした");
      }
    };

    fetchUsers();
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>ユーザー一覧</h1>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ユーザー名</th>
            <th>Email</th>
            <th>Role</th>
            <th>作成日</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.createdAt}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">ユーザーがいません</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;