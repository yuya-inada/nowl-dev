// src/utils/api.js
export async function apiFetch(url, options = {}, setCurrentUser, navigate) {
  const token = localStorage.getItem("jwt");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (res.status === 401) {
    console.warn("Unauthorized - Token expired or invalid");
    localStorage.removeItem("jwt");
    setCurrentUser(null);
    navigate("/login");
    throw new Error("Unauthorized - Token expired or invalid");
  }

  // エラー時も中身は消費せず返す
  if (!res.ok) {
    // エラー内容はフロント側で読む
    console.error("API error:", res.status, res.statusText);
  }

  return res; // Response をそのまま返す
}