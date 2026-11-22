import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Files,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { apiFetch, logout } from "../auth/authStore";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "My Files", path: "/myfiles", icon: Files },
  { name: "Shared Files", path: "/sharedfiles", icon: Share2 },
  { name: "Storage", path: "/storage", icon: HardDrive },
  { name: "Settings", path: "/settings", icon: Settings },
];

function DashboardShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/auth/me").then((response) => response.json()),
      apiFetch("/api/files").then((response) => response.json()),
    ])
      .then(([userResponse, filesResponse]) => {
        if (userResponse.success) setUser(userResponse.user);
        if (filesResponse.success) setFiles(filesResponse.files);
      })
      .catch(() => {});
  }, [location.pathname]);

  const totalSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files],
  );

  const displayName = user?.name || user?.email || "User";
  const activePage = navigation.find(
    (item) => item.path === location.pathname,
  )?.name || "Dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {mobileMenu && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#262626] bg-[#0A0A0A] transition-transform duration-300 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#262626] px-6">
          <Link to="/" className="text-2xl font-bold">Storvex</Link>
          <button
            type="button"
            onClick={() => setMobileMenu(false)}
            className="text-gray-400 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Workspace
          </p>
          <nav className="space-y-2">
            {navigation.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={name}
                to={path}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 ${
                    isActive
                      ? "border border-[#B7F542]/20 bg-[#B7F542]/10 text-[#B7F542]"
                      : "text-gray-400 hover:bg-[#171717] hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{name}</span>
              </NavLink>
            ))}
          </nav>

          <Link
            to="/upload"
            onClick={() => setMobileMenu(false)}
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#B7F542] px-4 py-3 font-semibold text-black"
          >
            <Upload size={18} />
            Upload Files
          </Link>

          <div className="mt-6 rounded-2xl border border-[#262626] bg-[#141414] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Storage used</span>
              <HardDrive size={18} className="text-[#B7F542]" />
            </div>
            <p className="text-sm font-semibold">{formatSize(totalSize)}</p>
          </div>
        </div>

        <div className="border-t border-[#262626] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B7F542] font-bold text-black">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
              {displayName}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-[#262626] bg-[#0A0A0A]/95 px-5 backdrop-blur-md sm:px-8">
          <button
            type="button"
            onClick={() => setMobileMenu(true)}
            className="text-gray-400 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold sm:text-2xl">{activePage}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}

export default DashboardShell;
