
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Files,
  Share2,
  HardDrive,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  Grid2X2,
  List,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  MoreVertical,
  Users,
  Clock,
  Plus,
  ChevronDown,
  Link2,
  Download,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const fileIcons = {
  pdf: FileText,
  fig: FileImage,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  zip: File,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  doc: FileText,
  docx: FileText,
};

const fileColors = {
  pdf: "text-red-400",
  fig: "text-purple-400",
  xlsx: "text-green-400",
  xls: "text-green-400",
  zip: "text-yellow-400",
  png: "text-pink-400",
  jpg: "text-pink-400",
  jpeg: "text-pink-400",
  doc: "text-orange-400",
  docx: "text-orange-400",
};

const getFileExtension = (fileName = "") =>
  fileName.split(".").pop()?.toLowerCase() || "";

const getFileIcon = (fileName) => {
  const extension = getFileExtension(fileName);
  return fileIcons[extension] || File;
};

const getFileColor = (fileName) => {
  const extension = getFileExtension(fileName);
  return fileColors[extension] || "text-gray-400";
};

function SharedFiles() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);

  const [shareModal, setShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("view");
  const [shareLoading, setShareLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sidebarLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Files",
      path: "/myfiles",
      icon: Files,
    },
    {
      name: "Shared Files",
      path: "/sharedfiles",
      icon: Share2,
    },
    {
      name: "Storage",
      path: "/storage",
      icon: HardDrive,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  // Fetch shared files from backend
  const fetchSharedFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/shared-files`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shared files.");
      }

      const result = await response.json();

      // Supports either an array or { files: [] }
      const fileData = Array.isArray(result)
        ? result
        : result.files || [];

      setFiles(fileData);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  // Search and tab filtering
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const fileName = file.name || file.fileName || "";

      const matchesSearch = fileName
        .toLowerCase()
        .includes(search.toLowerCase());

      const ownerId = file.ownerId || file.owner?._id;
      const currentUserId = file.currentUserId;

      const isOwnedByCurrentUser =
        file.isOwner === true ||
        (currentUserId && ownerId === currentUserId);

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "byYou" && isOwnedByCurrentUser) ||
        (activeTab === "withYou" && !isOwnedByCurrentUser);

      return matchesSearch && matchesTab;
    });
  }, [files, search, activeTab]);

  const totalCollaborators = useMemo(() => {
    const collaboratorIds = new Set();

    files.forEach((file) => {
      (file.sharedWith || []).forEach((person) => {
        const id = person._id || person.id || person.email;

        if (id) collaboratorIds.add(id);
      });
    });

    return collaboratorIds.size;
  }, [files]);

  const pendingInvitations = useMemo(() => {
    return files.reduce((count, file) => {
      return (
        count +
        (file.sharedWith || []).filter(
          (person) => person.status === "pending"
        ).length
      );
    }, 0);
  }, [files]);

  // Share file through backend
  const handleShareFile = async (e) => {
    e.preventDefault();

    if (!selectedFile || !shareEmail.trim()) return;

    try {
      setShareLoading(true);

      const response = await fetch(
        `${API_URL}/api/shared-files/${selectedFile._id}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: shareEmail.trim(),
            permission: sharePermission,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to share this file.");
      }

      setShareEmail("");
      setSharePermission("view");
      setShareModal(false);
      setSelectedFile(null);

      await fetchSharedFiles();
    } catch (err) {
      setError(err.message || "Failed to share file.");
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async (file) => {
    try {
      const shareLink = file.shareUrl || file.sharedLink;

      if (!shareLink) {
        setError("A share link is not available for this file.");
        return;
      }

      await navigator.clipboard.writeText(shareLink);
    } catch {
      setError("Unable to copy the share link.");
    }
  };

  const handleDownload = (file) => {
    const downloadUrl = file.downloadUrl || file.url;

    if (!downloadUrl) {
      setError("Download URL is not available.");
      return;
    }

    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleRemoveAccess = async (file) => {
    if (!file._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove sharing access for this file?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/shared-files/${file._id}/access`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to remove access.");
      }

      setSelectedFile(null);
      await fetchSharedFiles();
    } catch (err) {
      setError(err.message || "Failed to remove access.");
    }
  };

  const openShareModal = (file) => {
    setSelectedFile(file);
    setShareModal(true);
  };

  const renderCollaborators = (sharedWith = []) => {
    if (!sharedWith.length) {
      return (
        <span className="text-xs text-gray-500">
          No collaborators
        </span>
      );
    }

    return (
      <div className="flex -space-x-2">
        {sharedWith.slice(0, 4).map((person, index) => {
          const name =
            person.name ||
            person.fullName ||
            person.email ||
            "Collaborator";

          const initials = name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();

          return (
            <div
              key={person._id || person.id || person.email || index}
              title={name}
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#141414] bg-[#333333] text-[10px] font-bold text-white"
            >
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "?"
              )}
            </div>
          );
        })}

        {sharedWith.length > 4 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#141414] bg-[#262626] text-[10px] text-gray-300">
            +{sharedWith.length - 4}
          </div>
        )}
      </div>
    );
  };

  const renderPermission = (permission) => {
    const normalizedPermission = permission || "view";

    const label =
      normalizedPermission === "edit" ||
      normalizedPermission === "Can edit"
        ? "Can edit"
        : "Can view";

    return (
      <span
        className={`rounded-lg px-2.5 py-1 text-xs ${
          label === "Can edit"
            ? "bg-[#B7F542]/10 text-[#B7F542]"
            : "bg-[#262626] text-gray-400"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E8D8]">
      {/* Mobile Overlay */}
      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#262626] bg-[#0A0A0A] transition-transform duration-300 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#262626] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B7F542]">
              <HardDrive size={20} className="text-black" />
            </div>

            <span className="text-xl font-bold tracking-tight text-white">
              Storvex
            </span>
          </div>

          <button
            onClick={() => setMobileMenu(false)}
            className="text-gray-400 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#B7F542] text-black"
                        : "text-gray-400 hover:bg-[#171717] hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[#262626] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#262626]">
              <Users size={18} className="text-gray-300" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                Account
              </p>

              <p className="truncate text-xs text-gray-500">
                Workspace
              </p>
            </div>

            <MoreVertical size={18} className="text-gray-500" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#262626] bg-[#0A0A0A]/95 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenu(true)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="text-xs text-gray-500">
                Workspace / Files
              </p>

              <h1 className="text-lg font-semibold text-white">
                Shared Files
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-xl border border-[#262626] p-2.5 text-gray-400 transition hover:bg-[#171717] hover:text-white">
              <Bell size={19} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-5 py-8 md:px-8">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Shared with others
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Manage files you have shared and files shared with you.
              </p>
            </div>

            <button
              onClick={() => openShareModal(null)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#B7F542] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#a5df35]"
            >
              <Plus size={18} />
              Share a file
            </button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Total shared files
                </p>

                <Share2 size={18} className="text-[#B7F542]" />
              </div>

              <h3 className="text-3xl font-bold text-white">
                {files.length}
              </h3>

              <p className="mt-2 text-xs text-gray-500">
                Files in your shared workspace
              </p>
            </div>

            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  People with access
                </p>

                <Users size={18} className="text-[#B7F542]" />
              </div>

              <h3 className="text-3xl font-bold text-white">
                {totalCollaborators}
              </h3>

              <p className="mt-2 text-xs text-gray-500">
                Collaborators on your files
              </p>
            </div>

            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Pending invitations
                </p>

                <Clock size={18} className="text-[#B7F542]" />
              </div>

              <h3 className="text-3xl font-bold text-white">
                {pendingInvitations}
              </h3>

              <p className="mt-2 text-xs text-gray-500">
                Invitations awaiting response
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>

              <button
                onClick={() => setError("")}
                className="text-red-400"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Tabs and Search */}
          <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { label: "All shared", value: "all" },
                { label: "Shared by you", value: "byYou" },
                { label: "Shared with you", value: "withYou" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab.value
                      ? "bg-[#B7F542] text-black"
                      : "border border-[#262626] text-gray-400 hover:bg-[#171717] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex w-full items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] px-4 py-3 sm:w-64">
                <Search size={18} className="text-gray-500" />

                <input
                  type="text"
                  placeholder="Search shared files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                />
              </div>

              <div className="flex rounded-xl border border-[#262626] bg-[#141414] p-1">
                <button
                  onClick={() => setView("grid")}
                  className={`rounded-lg p-2 ${
                    view === "grid"
                      ? "bg-[#B7F542] text-black"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  <Grid2X2 size={18} />
                </button>

                <button
                  onClick={() => setView("list")}
                  className={`rounded-lg p-2 ${
                    view === "list"
                      ? "bg-[#B7F542] text-black"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              <button
                onClick={fetchSharedFiles}
                className="rounded-xl border border-[#262626] bg-[#141414] p-3 text-gray-400 hover:text-white"
                title="Refresh files"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw
                  size={28}
                  className="animate-spin text-[#B7F542]"
                />

                <p className="text-sm text-gray-500">
                  Loading shared files...
                </p>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-[#262626] bg-[#141414] py-20 text-center">
              <Share2
                size={40}
                className="mx-auto mb-4 text-gray-600"
              />

              <h3 className="text-lg font-semibold text-white">
                No shared files found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Shared files will appear here when available.
              </p>
            </div>
          ) : view === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredFiles.map((file) => {
                const fileName = file.name || file.fileName || "";
                const Icon = getFileIcon(fileName);

                return (
                  <div
                    key={file._id}
                    className="group rounded-2xl border border-[#262626] bg-[#141414] p-5 transition hover:border-[#B7F542]/40 hover:bg-[#181818]"
                  >
                    <div className="mb-5 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F1F1F]">
                        <Icon
                          size={24}
                          className={getFileColor(fileName)}
                        />
                      </div>

                      <button
                        onClick={() => setSelectedFile(file)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-[#262626] hover:text-white"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    <h3 className="truncate font-semibold text-white">
                      {fileName}
                    </h3>

                    <p className="mt-2 text-xs text-gray-500">
                      {file.size || file.formattedSize || "—"}
                      {" · "}
                      {file.sharedAt
                        ? new Date(file.sharedAt).toLocaleDateString()
                        : "—"}
                    </p>

                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Owner:
                      </span>

                      <span className="truncate text-xs font-medium text-gray-300">
                        {file.owner?.name ||
                          file.ownerName ||
                          file.owner?.email ||
                          "Unknown"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#262626] pt-4">
                      {renderCollaborators(file.sharedWith)}

                      {renderPermission(file.permission)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="overflow-x-auto rounded-2xl border border-[#262626] bg-[#141414]">
              <table className="w-full min-w-[750px] text-left">
                <thead>
                  <tr className="border-b border-[#262626] text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4 font-medium">File name</th>
                    <th className="px-6 py-4 font-medium">Owner</th>
                    <th className="px-6 py-4 font-medium">Shared with</th>
                    <th className="px-6 py-4 font-medium">Permission</th>
                    <th className="px-6 py-4 font-medium">Date shared</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFiles.map((file) => {
                    const fileName = file.name || file.fileName || "";
                    const Icon = getFileIcon(fileName);

                    return (
                      <tr
                        key={file._id}
                        className="border-b border-[#262626] transition hover:bg-[#1A1A1A]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Icon
                              size={20}
                              className={getFileColor(fileName)}
                            />

                            <div>
                              <p className="text-sm font-medium text-white">
                                {fileName}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {file.size || file.formattedSize || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-400">
                          {file.owner?.name ||
                            file.ownerName ||
                            file.owner?.email ||
                            "Unknown"}
                        </td>

                        <td className="px-6 py-4">
                          {renderCollaborators(file.sharedWith)}
                        </td>

                        <td className="px-6 py-4">
                          {renderPermission(file.permission)}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-400">
                          {file.sharedAt
                            ? new Date(file.sharedAt).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedFile(file)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-[#262626] hover:text-white"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4">
            <ShieldCheck
              size={20}
              className="shrink-0 text-[#B7F542]"
            />

            <p className="text-xs leading-relaxed text-gray-500">
              Shared files and collaborator permissions are loaded from
              your workspace.
            </p>
          </div>
        </div>
      </main>

      {/* File Actions Modal */}
      {selectedFile && !shareModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#262626] bg-[#141414] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                File actions
              </h3>

              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-5 truncate text-sm text-gray-400">
              {selectedFile.name || selectedFile.fileName}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShareModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-gray-300 transition hover:bg-[#262626]"
              >
                <Users size={18} />
                Manage access
              </button>

              <button
                onClick={() => handleCopyLink(selectedFile)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-gray-300 transition hover:bg-[#262626]"
              >
                <Link2 size={18} />
                Copy link
              </button>

              <button
                onClick={() => handleDownload(selectedFile)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-gray-300 transition hover:bg-[#262626]"
              >
                <Download size={18} />
                Download
              </button>

              <button
                onClick={() => handleRemoveAccess(selectedFile)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <Trash2 size={18} />
                Remove access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setShareModal(false);
            setSelectedFile(null);
          }}
        >
          <form
            onSubmit={handleShareFile}
            className="w-full max-w-md rounded-2xl border border-[#262626] bg-[#141414] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Share a file
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShareModal(false);
                  setSelectedFile(null);
                }}
                className="text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-2 block text-sm text-gray-400">
              File
            </label>

            <select
              value={selectedFile?._id || ""}
              onChange={(e) => {
                const file = files.find(
                  (item) => item._id === e.target.value
                );

                setSelectedFile(file || null);
              }}
              required
              className="mb-5 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none focus:border-[#B7F542]"
            >
              <option value="" disabled>
                Select a file
              </option>

              {files.map((file) => (
                <option key={file._id} value={file._id}>
                  {file.name || file.fileName}
                </option>
              ))}
            </select>

            <label className="mb-2 block text-sm text-gray-400">
              Email address
            </label>

            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="Enter recipient email"
              required
              className="mb-5 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none focus:border-[#B7F542] placeholder:text-gray-600"
            />

            <label className="mb-2 block text-sm text-gray-400">
              Permission
            </label>

            <div className="relative mb-6">
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none focus:border-[#B7F542]"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={shareLoading || !selectedFile}
              className="w-full rounded-xl bg-[#B7F542] py-3 text-sm font-semibold text-black transition hover:bg-[#a5df35] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {shareLoading ? "Sharing..." : "Share"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default SharedFiles;
