import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home";
import UploadPage from "./pages/UploadPage";
import Dashboard from "./pages/Dashboard";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Signup from "./pages/Signup";
import Login from "./pages/Login"
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import MyFiles from "./pages/MyFiles";
import SharedFiles from "./pages/SharedFiles";
import Settings from "./pages/Settings";
import UpgradeStorage from "./pages/UpgradeStorage";
import SharePage from "./pages/SharePage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/s/:token" element={<SharePage />} />
        <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/howitworks" element={<HowItWorks/>}/>
        <Route element={<ProtectedRoute />}>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/myfiles" element={<MyFiles />} />
        <Route path="/sharedfiles" element={<SharedFiles />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/storage" element={<UpgradeStorage />} />
        <Route path="/upgrade-storage" element={<UpgradeStorage />} />
        </Route>
        </Route>
         <Route path="/signup" element={<Signup />} />
         <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
