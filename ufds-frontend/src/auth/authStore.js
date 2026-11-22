const API_URL = (import.meta.env.VITE_API_URL || "https://storvexx.onrender.com").replace(/\/$/, "");
let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const getAccessToken = () => accessToken;

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Authentication required");
        const data = await response.json();
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const apiFetch = async (path, options = {}) => {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  let response = await fetch(`${API_URL}${path}`, {
    ...options, headers, credentials: "include",
  });
  if (response.status === 401) {
    try {
      const token = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(`${API_URL}${path}`, {
        ...options, headers, credentials: "include",
      });
    } catch {
      clearAccessToken();
    }
  }
  return response;
};

export const logout = async () => {
  await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
  clearAccessToken();
};
