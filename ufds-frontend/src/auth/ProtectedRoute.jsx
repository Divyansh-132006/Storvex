import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, refreshAccessToken } from "./authStore";

function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    if (getAccessToken()) {
      setAuthenticated(true);
      return;
    }
    refreshAccessToken()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return null;
  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
