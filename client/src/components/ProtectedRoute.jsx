import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page">Loading...</div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}
