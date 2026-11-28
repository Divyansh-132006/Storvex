import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, LockKeyhole } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "https://storvexx.onrender.com").replace(/\/$/, "");

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

function SharePage() {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loadedToken, setLoadedToken] = useState(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/share/${encodeURIComponent(token)}/info`, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 404) throw new Error("Link not available");
          if (response.status === 429)
            throw new Error("Too many requests. Please wait and try again.");
          throw new Error("Unable to load this link.");
        }
        if (active) {
          setFile(data);
          setMessage("");
          setLoadedToken(token);
        }
      })
      .catch((error) => {
        if (active) {
          const knownMessages = [
            "Link not available",
            "Too many requests. Please wait and try again.",
          ];
          setMessage(
            knownMessages.includes(error.message)
              ? error.message
              : "Unable to load this link.",
          );
          setFile(null);
          setLoadedToken(token);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const currentFile = loadedToken === token ? file : null;
  const currentMessage = loadedToken === token ? message : "";
  const currentLoading = loadedToken !== token || loading;

  const download = async (event) => {
    event.preventDefault();
    setMessage("");
    setDownloading(true);
    try {
      const requiresPassword = Boolean(currentFile?.requiresPassword);
      const response = await fetch(
        `${API_URL}/api/share/${encodeURIComponent(token)}/download`,
        {
          method: requiresPassword ? "POST" : "GET",
          headers: requiresPassword ? { "Content-Type": "application/json" } : undefined,
          body: requiresPassword ? JSON.stringify({ password }) : undefined,
          credentials: "omit",
          referrerPolicy: "no-referrer",
        },
      );
      if (!response.ok) {
        if (response.status === 404) throw new Error("Link not available");
        if (response.status === 401) throw new Error("Incorrect password. Try again.");
        if (response.status === 429) throw new Error("Too many attempts. Please wait and try again.");
        throw new Error("Download failed. Please try again.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = currentFile.fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-5 py-12 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-[#292929] bg-[#141414] p-7 shadow-2xl sm:p-9">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#B7F542]/10 text-[#B7F542]">
          <LockKeyhole size={23} />
        </div>
        <h1 className="text-2xl font-bold">Shared file</h1>
        {currentLoading ? (
          <p className="mt-4 text-sm text-gray-400">Checking link...</p>
        ) : !currentFile ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {currentMessage || "Link not available"}
          </p>
        ) : (
          <>
            <p className="mt-4 break-words text-lg font-medium">{currentFile.fileName}</p>
            <p className="mt-1 text-sm text-gray-400">{formatSize(currentFile.size)}</p>
            <form onSubmit={download} className="mt-6 space-y-4">
              {currentFile.requiresPassword && (
                <label className="block text-sm">
                  Link password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 block w-full rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2.5"
                  />
                </label>
              )}
              {currentMessage && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{currentMessage}</p>}
              <button disabled={downloading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B7F542] px-4 py-3 font-semibold text-black disabled:opacity-50">
                <Download size={18} /> {downloading ? "Preparing download..." : "Download"}
              </button>
            </form>
          </>
        )}
        <p className="mt-7 border-t border-[#292929] pt-4 text-xs leading-5 text-gray-500">
          This link may be forwarded. Anyone holding it can download the file until it expires, is revoked, or reaches its limit.
        </p>
      </section>
    </main>
  );
}

export default SharePage;
