import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/NavBar";
import Footer from "../components/Footer";

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

  return (
    <>
      {!isDashboard && <Navbar />}

      <Outlet />

      <div className={isDashboard ? "lg:ml-64" : ""}>
        <Footer />
      </div>
    </>
  );
}

export default MainLayout;