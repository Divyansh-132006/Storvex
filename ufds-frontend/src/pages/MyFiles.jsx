import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, File, FileArchive, FileText, Image, Search, Trash2, Upload } from "lucide-react";
import { apiFetch } from "../auth/authStore";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const fileIcon = (mime) => {
  if (mime?.startsWith("image/")) return Image;
  if (mime?.includes("zip") || mime?.includes("archive")) return FileArchive;
  if (mime?.includes("text") || mime?.includes("pdf")) return FileText;
  return File;
};

function MyFiles() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadFiles = async () => {
    try {
      const response = await apiFetch("/api/files");
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("Unable to load files");
      setFiles(data.files);
    } catch {
      setError("Unable to load your files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = useMemo(
    () => files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase())),
    [files, search],
  );

  const downloadFile = async (file) => {
    setBusyId(file.id);
    try {
      const response = await apiFetch(`/api/files/${file.id}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download this file.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    setBusyId(file.id);
    try {
      const response = await apiFetch(`/api/files/${file.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setFiles((current) => current.filter((item) => item.id !== file.id));
    } catch {
      setError("Unable to delete this file.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-8 text-white sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <Link to="/dashboard" className="mb-3 inline-block text-sm text-[#B7F542]">
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">My Files</h1>
          <p className="mt-2 text-sm text-gray-400">Your uploaded files.</p>
        </div>
        <Link to="/upload" className="flex items-center gap-2 rounded-xl bg-[#B7F542] px-5 py-3 font-semibold text-black">
          <Upload size={18} /> Upload Files
        </Link>
      </div>

      <div className="mb-6 flex max-w-md items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] px-4 py-3">
        <Search size={18} className="text-gray-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your files..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
        />
      </div>

      {error && <p className="mb-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-300">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Loading your files...</p>
        ) : filteredFiles.length === 0 ? (
          <p className="p-10 text-center text-gray-500">
            {search ? "No matching files found." : "No files uploaded yet."}
          </p>
        ) : (
          <div className="divide-y divide-[#262626]">
            {filteredFiles.map((file) => {
              const Icon = fileIcon(file.mime);
              return (
                <div key={file.id} className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="shrink-0 text-[#B7F542]" size={22} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => downloadFile(file)}
                      disabled={busyId === file.id}
                      className="rounded-lg p-2 text-gray-400 hover:bg-[#262626] hover:text-white disabled:opacity-50"
                      aria-label={`Download ${file.name}`}
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => deleteFile(file)}
                      disabled={busyId === file.id}
                      className="rounded-lg p-2 text-gray-400 hover:bg-[#262626] hover:text-red-400 disabled:opacity-50"
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyFiles;
