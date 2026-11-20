import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const response = await api.post("/auth/refresh");
      const token = response.data.accessToken;
      setAccessToken(token);
      onRefreshed(token);
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      onRefreshed(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
