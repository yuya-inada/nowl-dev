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

  // JWTが無効 or 期限切れの場合
  if (res.status === 401) {
    console.warn("Unauthorized - Token expired or invalid");
    localStorage.removeItem("jwt");
    setCurrentUser(null);
    navigate("/login");
    throw new Error("Unauthorized - Token expired or invalid");
  }

  return res;
}