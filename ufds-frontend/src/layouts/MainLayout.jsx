import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import Footer from "../components/Footer";
import DashboardShell from "../components/DashboardShell";

function MainLayout() {
  const location = useLocation();

  const dashboardRoutes = [
    "/dashboard",
    "/myfiles",
    "/sharedfiles",
    "/storage",
    "/settings",
  ];

  const isDashboard = dashboardRoutes.some(
    (route) => location.pathname.startsWith(route)
  );
  const usesSharedDashboardShell = [
    "/myfiles",
    "/upload",
    "/storage",
    "/upgrade-storage",
    "/settings",
  ].some((route) => location.pathname.startsWith(route));

  return (
    <>
      {!isDashboard && <Navbar />}

      {usesSharedDashboardShell ? (
        <DashboardShell>
          <Outlet />
        </DashboardShell>
      ) : (
        <Outlet />
      )}

      <div className={isDashboard ? "lg:ml-64" : ""}>
        <Footer />
      </div>
    </>
  );
}

export default MainLayout;