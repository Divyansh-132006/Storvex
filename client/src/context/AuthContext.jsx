import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, { setAccessToken } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateSession = useCallback((nextUser, token) => {
    setUser(nextUser);
    setToken(token);
    setAccessToken(token);
  }, []);

  useEffect(() => {
    let active = true;
    api.post("/auth/refresh")
      .then((response) => {
        if (active) updateSession(response.data.user, response.data.accessToken);
      })
      .catch(() => {
        if (active) updateSession(null, null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [updateSession]);

  const signup = useCallback(async (name, email, password) => {
    const response = await api.post("/auth/signup", { name, email, password });
    updateSession(response.data.user, response.data.accessToken);
    return response.data.user;
  }, [updateSession]);

  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    updateSession(response.data.user, response.data.accessToken);
    return response.data.user;
  }, [updateSession]);

  const googleLogin = useCallback(async (idToken) => {
    const response = await api.post("/auth/google", { idToken });
    updateSession(response.data.user, response.data.accessToken);
    return response.data.user;
  }, [updateSession]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      updateSession(null, null);
    }
  }, [updateSession]);

  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    signup,
    login,
    googleLogin,
    logout,
  }), [user, accessToken, loading, signup, login, googleLogin, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
