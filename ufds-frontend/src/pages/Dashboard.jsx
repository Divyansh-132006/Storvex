
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
    Plus,
    MoreHorizontal,
    FileText,
    Image,
    Video,
    FileArchive,
    Menu,
    X,
    LogOut,
    ChevronRight
} from "lucide-react";
import { useState } from "react";

function Dashboard() {
    const [mobileMenu, setMobileMenu] = useState(false);

    const navigation = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "My Files", path: "/myfiles", icon: Files },
        { name: "Shared Files", path: "/sharedfiles", icon: Share2 },
        { name: "Storage", path: "/storage", icon: HardDrive },
        { name: "Settings", path: "/settings", icon: Settings },
    ];

    const recentFiles = [
        {
            name: "Portfolio Website.fig",
            type: "Design File",
            size: "24.5 MB",
            date: "Today, 10:42 AM",
            icon: Image,
            color: "text-purple-400",
        },
        {
            name: "Project Documentation.pdf",
            type: "PDF Document",
            size: "8.2 MB",
            date: "Yesterday",
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
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">

            {/* Mobile Menu Overlay */}
            {mobileMenu && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 lg:hidden"
                    onClick={() => setMobileMenu(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col
    border-r border-[#262626] bg-[#0A0A0A] transition-transform duration-300
    ${mobileMenu ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0`}
            >

                {/* Logo */}
                <div className="flex h-20 items-center justify-between border-b border-[#262626] px-6">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B7F542]">
                            <HardDrive className="h-6 w-6 text-black" />
                        </div>
                        <span className="text-2xl font-bold">
                            Storvex
                        </span>
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
                                        `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
                                        ${isActive
                                            ? "bg-[#B7F542]/10 text-[#B7F542] border border-[#B7F542]/20"
                                            : "text-gray-400 hover:bg-[#171717] hover:text-white"
                                        }`
                                    }
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">
                                        {item.name}
                                    </span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Storage Card */}
                    <div className="mt-10 rounded-2xl border border-[#262626] bg-[#141414] p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Storage
                            </span>
                            <HardDrive size={18} className="text-[#B7F542]" />
                        </div>

                        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#262626]">
                            <div className="h-full w-[68%] rounded-full bg-[#B7F542]" />
                        </div>

                        <p className="text-sm text-gray-400">
                            <span className="font-semibold text-white">
                                6.8 GB
                            </span>{" "}
                            of 10 GB used
                        </p>

                        <Link
                            to="/upgrade-storage"
                            className="mt-4 flex items-center justify-between text-sm font-medium text-[#B7F542] hover:text-[#A6E632]"
                        >
                            Upgrade Storage
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Bottom User */}
                <div className="border-t border-[#262626] p-4">
                    <div className="flex items-center gap-3 rounded-xl p-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B7F542] font-bold text-black">
                            DU
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold">
                                Divyansh Upadhyay
                            </p>
                            <p className="truncate text-xs text-gray-500">
                                Free Plan
                            </p>
                        </div>

                        <button className="text-gray-400 hover:text-white">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="min-h-screen lg:ml-64">

                {/* Topbar */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#262626] bg-[#0A0A0A]/95 px-5 backdrop-blur-md sm:px-8">

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenu(true)}
                            className="text-gray-400 hover:text-white lg:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        <h1 className="text-xl font-semibold sm:text-2xl">
                            Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">

                        {/* Search */}
                        <div className="hidden items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] px-4 py-2.5 md:flex">
                            <Search size={18} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                            />
                            <span className="rounded border border-[#333] px-2 py-0.5 text-xs text-gray-500">
                                /
                            </span>
                        </div>

                        {/* Notification */}
                        <button className="relative rounded-xl border border-[#262626] bg-[#141414] p-2.5 text-gray-400 hover:text-white">
                            <Bell size={20} />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#B7F542]" />
                        </button>

                        {/* Profile */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B7F542] font-bold text-black">
                            DU
                        </div>
                    </div>
                </header>

                {/* Dashboard Body */}
                <div className="p-5 sm:p-8">

                    {/* Welcome */}
                    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-2xl font-bold sm:text-3xl">
                                Welcome back, Divyansh
                            </h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Here&apos;s what&apos;s happening with your storage today.
                            </p>
                        </div>

                        <button
                            onClick={() => document.getElementById("file-upload")?.click()}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#B7F542] px-5 py-3 font-semibold text-black transition hover:bg-[#A6E632]"
                        >
                            <Upload size={18} />
                            Upload Files
                        </button>

                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            className="hidden"
                        />
                    </div>

                    {/* Stats */}
                    <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

                        {/* Storage Used */}
                        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    Storage Used
                                </p>
                                <div className="rounded-xl bg-[#B7F542]/10 p-3">
                                    <HardDrive className="text-[#B7F542]" size={22} />
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold">
                                6.8 GB
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    / 10 GB
                                </span>
                            </h3>

                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#262626]">
                                <div className="h-full w-[68%] rounded-full bg-[#B7F542]" />
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                68% of your storage is used
                            </p>
                        </div>

                        {/* Total Files */}
                        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    Total Files
                                </p>
                                <div className="rounded-xl bg-orange-400/10 p-3">
                                    <Files className="text-orange-400" size={22} />
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold">
                                248
                            </h3>

                            <p className="mt-3 text-xs text-gray-500">
                                Files stored in your workspace
                            </p>
                        </div>

                        {/* Shared Files */}
                        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6 sm:col-span-2 xl:col-span-1">
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    Shared Files
                                </p>
                                <div className="rounded-xl bg-purple-400/10 p-3">
                                    <Share2 className="text-purple-400" size={22} />
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold">
                                32
                            </h3>

                            <p className="mt-3 text-xs text-gray-500">
                                Files shared with others
                            </p>
                        </div>
                    </div>

                    {/* Recent Files */}
                    <section className="rounded-2xl border border-[#262626] bg-[#141414]">

                        <div className="flex flex-col justify-between gap-4 border-b border-[#262626] p-5 sm:flex-row sm:items-center sm:px-6">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Recent Files
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Access your recently uploaded files
                                </p>
                            </div>

                            <Link
                                to="/myfiles"
                                className="text-sm font-medium text-[#B7F542] hover:text-[#A6E632]"
                            >
                                View All Files →
                            </Link>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left">
                                <thead>
                                    <tr className="border-b border-[#262626] text-xs uppercase tracking-wider text-gray-500">
                                        <th className="px-6 py-4 font-medium">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 font-medium">
                                            Size
                                        </th>
                                        <th className="px-6 py-4 font-medium">
                                            Modified
                                        </th>
                                        <th className="px-6 py-4 font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentFiles.map((file, index) => {
                                        const Icon = file.icon;

                                        return (
                                            <tr
                                                key={index}
                                                className="border-b border-[#262626] last:border-0 transition hover:bg-[#1A1A1A]"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Icon
                                                            size={22}
                                                            className={file.color}
                                                        />

                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {file.name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {file.type}
                                                            </p>
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
                    </section>

                    {/* File Types */}
                    <section className="mt-8">
                        <h3 className="mb-5 text-lg font-semibold">
                            File Categories
                        </h3>

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                            {[
                                {
                                    name: "Documents",
                                    count: "86 Files",
                                    icon: FileText,
                                    color: "text-red-400",
                                    bg: "bg-red-400/10",
                                },
                                {
                                    name: "Images",
                                    count: "104 Files",
                                    icon: Image,
                                    color: "text-purple-400",
                                    bg: "bg-purple-400/10",
                                },
                                {
                                    name: "Videos",
                                    count: "32 Files",
                                    icon: Video,
                                    color: "text-orange-400",
                                    bg: "bg-orange-400/10",
                                },
                                {
                                    name: "Archives",
                                    count: "26 Files",
                                    icon: FileArchive,
                                    color: "text-yellow-400",
                                    bg: "bg-yellow-400/10",
                                },
                            ].map((category) => {
                                const Icon = category.icon;

                                return (
                                    <div
                                        key={category.name}
                                        className="rounded-2xl border border-[#262626] bg-[#141414] p-5 transition hover:border-[#B7F542]/30"
                                    >
                                        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${category.bg}`}>
                                            <Icon size={22} className={category.color} />
                                        </div>

                                        <h4 className="font-semibold">
                                            {category.name}
                                        </h4>

                                        <p className="mt-2 text-sm text-gray-500">
                                            {category.count}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}

export default Dashboard;
