import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Files,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
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

function Dashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/auth/me").then((response) => response.json()),
      apiFetch("/api/files").then((response) => response.json()),
    ])
      .then(([userResponse, filesResponse]) => {
        if (!userResponse.success || !filesResponse.success) {
          throw new Error("Unable to load dashboard data");
        }
        setUser(userResponse.user);
        setFiles(filesResponse.files);
      })
      .catch(() => setError("Unable to load your dashboard data."));
  }, []);

  const totalSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files],
  );
  const recentFiles = files.slice(0, 5);
  const displayName = user?.name || user?.email || "User";

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Files", path: "/myfiles", icon: Files },
    { name: "Shared Files", path: "/sharedfiles", icon: Share2 },
    { name: "Storage", path: "/storage", icon: HardDrive },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#262626] bg-[#0A0A0A] transition-transform duration-300 ${mobileMenu ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-20 items-center justify-between border-b border-[#262626] px-6">
          <Link to="/" className="text-2xl font-bold">Storvex</Link>
          <button onClick={() => setMobileMenu(false)} className="text-gray-400 lg:hidden">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Workspace</p>
          <nav className="space-y-2">
            {navigation.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={name}
                to={path}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 ${isActive ? "border border-[#B7F542]/20 bg-[#B7F542]/10 text-[#B7F542]" : "text-gray-400 hover:bg-[#171717] hover:text-white"}`}
              >
                <Icon size={20} />
                <span className="font-medium">{name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-[#262626] bg-[#141414] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Storage used</span>
              <HardDrive size={18} className="text-[#B7F542]" />
            </div>
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">{formatSize(totalSize)}</span>
            </p>
          </div>
        </div>

        <div className="border-t border-[#262626] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B7F542] font-bold text-black">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <p className="flex-1 truncate text-sm font-semibold">{displayName}</p>
            <button onClick={logout} className="text-gray-400 hover:text-white" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#262626] bg-[#0A0A0A]/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenu(true)} className="text-gray-400 lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          </div>
          <div className="hidden items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] px-4 py-2.5 md:flex">
            <Search size={18} className="text-gray-500" />
            <span className="text-sm text-gray-500">Search files...</span>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Welcome back, {displayName}</h2>
              <p className="mt-2 text-sm text-gray-400">Your storage overview.</p>
            </div>
            <Link to="/upload" className="flex items-center gap-2 rounded-xl bg-[#B7F542] px-5 py-3 font-semibold text-black">
              <Upload size={18} /> Upload Files
            </Link>
          </div>

          {error && <p className="mb-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-300">{error}</p>}

          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
              <p className="text-sm text-gray-400">Storage Used</p>
              <h3 className="mt-4 text-3xl font-bold">{formatSize(totalSize)}</h3>
            </div>
            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
              <p className="text-sm text-gray-400">Total Files</p>
              <h3 className="mt-4 text-3xl font-bold">{files.length}</h3>
            </div>
          </div>

          <section className="rounded-2xl border border-[#262626] bg-[#141414]">
            <div className="flex items-center justify-between border-b border-[#262626] p-5 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold">Recent Files</h3>
                <p className="mt-1 text-sm text-gray-500">Your latest uploaded files.</p>
              </div>
              <Link to="/myfiles" className="text-sm font-medium text-[#B7F542]">View All Files</Link>
            </div>
            {recentFiles.length === 0 ? (
              <p className="p-10 text-center text-gray-500">No files uploaded yet.</p>
            ) : (
              <div className="divide-y divide-[#262626]">
                {recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-4 px-6 py-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {new Date(file.createdAt).toLocaleDateString()}
                      <MoreHorizontal size={20} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
