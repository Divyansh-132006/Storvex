
import { NavLink, Link } from "react-router-dom";
import {
    LayoutDashboard,
    Files,
    Share2,
    HardDrive,
    Settings,
    Search,
    Bell,
    Upload,
    Folder,
    FileText,
    Image,
    Video,
    FileArchive,
    MoreHorizontal,
    Grid2X2,
    List,
    Plus,
    Menu,
    X,
    LogOut,
    ChevronRight,
    ArrowUpDown
} from "lucide-react";

import { useState } from "react";

function MyFiles() {
    const [mobileMenu, setMobileMenu] = useState(false);
    const [view, setView] = useState("list");
    const [search, setSearch] = useState("");

    const navigation = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "My Files", path: "/myfiles", icon: Files },
        { name: "Shared Files", path: "/sharedfiles", icon: Share2 },
        { name: "Storage", path: "/storage", icon: HardDrive },
        { name: "Settings", path: "/settings", icon: Settings },
    ];

    const folders = [
        { name: "Projects", files: 24, color: "text-[#B7F542]" },
        { name: "Documents", files: 86, color: "text-[#B7F542]" },
        { name: "Images", files: 104, color: "text-[#B7F542]" },
        { name: "Personal", files: 18, color: "text-[#B7F542]" },
    ];

    const files = [
        {
            name: "Portfolio Website.fig",
            type: "Design File",
            size: "24.5 MB",
            date: "Nov 12, 2026",
            icon: Image,
            color: "text-purple-400",
        },
        {
            name: "Project Documentation.pdf",
            type: "PDF Document",
            size: "8.2 MB",
            date: "Nov 11, 2026",
            icon: FileText,
            color: "text-red-400",
        },
        {
            name: "Product Demo.mp4",
            type: "Video",
            size: "156 MB",
            date: "Nov 09, 2026",
            icon: Video,
            color: "text-orange-400",
        },
        {
            name: "Source Code.zip",
            type: "Archive",
            size: "42.8 MB",
            date: "Nov 08, 2026",
            icon: FileArchive,
            color: "text-yellow-400",
        },
        {
            name: "Resume.pdf",
            type: "PDF Document",
            size: "1.4 MB",
            date: "Nov 07, 2026",
            icon: FileText,
            color: "text-red-400",
        },
    ];

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">

            {/* Mobile Overlay */}
            {mobileMenu && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 lg:hidden"
                    onClick={() => setMobileMenu(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#262626] bg-[#0A0A0A] transition-transform duration-300
                ${mobileMenu ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0`}
            >
                {/* Logo */}
                <div className="flex h-20 items-center justify-between border-b border-[#262626] px-6">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B7F542]">
                            <HardDrive className="h-6 w-6 text-black" />
                        </div>
                        <span className="text-2xl font-bold">Storvex</span>
                    </Link>

                    <button
                        onClick={() => setMobileMenu(false)}
                        className="text-gray-400 lg:hidden"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-6">
                    <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                        Workspace
                    </p>

                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setMobileMenu(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl px-4 py-3 transition-all
                                        ${
                                            isActive
                                                ? "border border-[#B7F542]/20 bg-[#B7F542]/10 text-[#B7F542]"
                                                : "text-gray-400 hover:bg-[#171717] hover:text-white"
                                        }`
                                    }
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Storage */}
                    <div className="mt-10 rounded-2xl border border-[#262626] bg-[#141414] p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium">Storage</span>
                            <HardDrive size={18} className="text-[#B7F542]" />
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#262626]">
                            <div className="h-full w-[68%] rounded-full bg-[#B7F542]" />
                        </div>

                        <p className="mt-3 text-sm text-gray-400">
                            <span className="font-semibold text-white">6.8 GB</span> of 10 GB used
                        </p>

                        <Link
                            to="/storage"
                            className="mt-4 flex items-center justify-between text-sm font-medium text-[#B7F542]"
                        >
                            Upgrade Storage
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* User */}
                <div className="border-t border-[#262626] p-4">
                    <div className="flex items-center gap-3 rounded-xl p-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B7F542] font-bold text-black">
                            DU
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold">
                                Divyansh Upadhyay
                            </p>
                            <p className="truncate text-xs text-gray-500">Free Plan</p>
                        </div>

                        <LogOut size={18} className="text-gray-400" />
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="min-h-screen lg:ml-64">

                {/* Topbar */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#262626] bg-[#0A0A0A]/95 px-5 backdrop-blur-md sm:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenu(true)}
                            className="text-gray-400 lg:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        <h1 className="text-xl font-semibold sm:text-2xl">My Files</h1>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="hidden items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] px-4 py-2.5 md:flex">
                            <Search size={18} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-40 bg-transparent text-sm outline-none placeholder:text-gray-500"
                            />
                        </div>

                        <button className="relative rounded-xl border border-[#262626] bg-[#141414] p-2.5 text-gray-400">
                            <Bell size={20} />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#B7F542]" />
                        </button>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B7F542] font-bold text-black">
                            DU
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-5 sm:p-8">

                    {/* Heading */}
                    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-2xl font-bold sm:text-3xl">All Files</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Manage and organize all your files in one place.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#141414] px-4 py-3 text-sm font-medium hover:border-[#B7F542]/40">
                                <Plus size={18} />
                                New Folder
                            </button>

                            <button
                                onClick={() => document.getElementById("my-file-upload")?.click()}
                                className="flex items-center gap-2 rounded-xl bg-[#B7F542] px-5 py-3 text-sm font-semibold text-black hover:bg-[#A6E632]"
                            >
                                <Upload size={18} />
                                Upload Files
                            </button>

                            <input
                                id="my-file-upload"
                                type="file"
                                multiple
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Folders */}
                    <section className="mb-10">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Folders</h3>
                            <span className="text-sm text-gray-500">4 folders</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {folders.map((folder) => (
                                <div
                                    key={folder.name}
                                    className="group cursor-pointer rounded-2xl border border-[#262626] bg-[#141414] p-5 transition hover:border-[#B7F542]/40 hover:bg-[#191919]"
                                >
                                    <div className="mb-5 flex items-center justify-between">
                                        <Folder size={36} className={folder.color} />
                                        <button className="text-gray-500 hover:text-white">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>

                                    <h4 className="font-semibold">{folder.name}</h4>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {folder.files} files
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Files Table */}
                    <section className="rounded-2xl border border-[#262626] bg-[#141414]">

                        <div className="flex flex-col justify-between gap-4 border-b border-[#262626] p-5 sm:flex-row sm:items-center sm:px-6">
                            <div>
                                <h3 className="text-lg font-semibold">Files</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {filteredFiles.length} files available
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setView("list")}
                                    className={`rounded-lg p-2 ${view === "list" ? "bg-[#B7F542]/10 text-[#B7F542]" : "text-gray-500 hover:text-white"}`}
                                >
                                    <List size={20} />
                                </button>

                                <button
                                    onClick={() => setView("grid")}
                                    className={`rounded-lg p-2 ${view === "grid" ? "bg-[#B7F542]/10 text-[#B7F542]" : "text-gray-500 hover:text-white"}`}
                                >
                                    <Grid2X2 size={20} />
                                </button>
                            </div>
                        </div>

                        {view === "list" ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead>
                                        <tr className="border-b border-[#262626] text-xs uppercase tracking-wider text-gray-500">
                                            <th className="px-6 py-4 font-medium">Name</th>
                                            <th className="px-6 py-4 font-medium">Size</th>
                                            <th className="px-6 py-4 font-medium">Modified</th>
                                            <th className="px-6 py-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredFiles.map((file) => {
                                            const Icon = file.icon;

                                            return (
                                                <tr
                                                    key={file.name}
                                                    className="border-b border-[#262626] last:border-0 hover:bg-[#1A1A1A]"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <Icon size={22} className={file.color} />
                                                            <div>
                                                                <p className="text-sm font-medium">{file.name}</p>
                                                                <p className="mt-1 text-xs text-gray-500">{file.type}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 text-sm text-gray-400">
                                                        {file.size}
                                                    </td>

                                                    <td className="px-6 py-5 text-sm text-gray-400">
                                                        {file.date}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <button className="rounded-lg p-2 text-gray-500 hover:bg-[#262626] hover:text-white">
                                                            <MoreHorizontal size={20} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredFiles.map((file) => {
                                    const Icon = file.icon;

                                    return (
                                        <div
                                            key={file.name}
                                            className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-5 hover:border-[#B7F542]/30"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <Icon size={28} className={file.color} />
                                                <MoreHorizontal size={20} className="text-gray-500" />
                                            </div>

                                            <h4 className="truncate text-sm font-medium">
                                                {file.name}
                                            </h4>

                                            <p className="mt-2 text-xs text-gray-500">
                                                {file.size} · {file.date}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {filteredFiles.length === 0 && (
                            <div className="p-10 text-center text-gray-500">
                                No files found.
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default MyFiles;
