import { Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "./components/Navbar";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/" element={<PublicOnlyRoute><Navigate to="/login" replace /></PublicOnlyRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
