import { useEffect, useState } from "react";
import { Copy, Link2, X } from "lucide-react";
import { apiFetch } from "../auth/authStore";

const expiryOptions = [
  ["1h", "1 hour"],
  ["24h", "24 hours"],
  ["7d", "7 days"],
  ["30d", "30 days"],
];

function ShareDialog({ file, onClose }) {
  const [expiresIn, setExpiresIn] = useState("24h");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [password, setPassword] = useState("");
  const [shares, setShares] = useState([]);
  const [createdUrl, setCreatedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchShares = async () => {
      try {
        const response = await apiFetch(`/api/files/${encodeURIComponent(file.id)}/shares`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error("Unable to load links");
        if (active) setShares(data.shares);
      } catch {
        if (active) setError("Unable to load share links.");
      }
    };
    fetchShares();
    return () => { active = false; };
  }, [file.id]);

  const loadShares = async () => {
    try {
      const response = await apiFetch(`/api/files/${encodeURIComponent(file.id)}/shares`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("Unable to load links");
      setShares(data.shares);
    } catch {
      setError("Unable to load share links.");
    }
  };

  const createLink = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreatedUrl("");
    setCopied(false);
    try {
      const body = { expiresIn };
      if (maxDownloads) body.maxDownloads = Number(maxDownloads);
      if (password) body.password = password;
      const response = await apiFetch(`/api/files/${encodeURIComponent(file.id)}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create link.");
      }
      setCreatedUrl(data.url);
      setPassword("");
      setMaxDownloads("");
      await loadShares();
    } catch (requestError) {
      setError(requestError.message || "Unable to create link.");
    } finally {
      setBusy(false);
    }
  };

  const revokeLink = async (shareId) => {
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch(`/api/shares/${encodeURIComponent(shareId)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Unable to revoke link.");
      await loadShares();
    } catch {
      setError("Unable to revoke link.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
    } catch {
      setError("Unable to copy the link. Select and copy it manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#303030] bg-[#141414] p-6 text-white shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="share-dialog-title" className="text-xl font-semibold">Share file</h2>
            <p className="mt-1 truncate text-sm text-gray-400">{file.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close share dialog" className="rounded-lg p-2 text-gray-400 hover:bg-[#262626]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={createLink} className="space-y-4 rounded-xl border border-[#292929] bg-[#101010] p-4">
          <label className="block text-sm">
            Expires after
            <select
              value={expiresIn}
              onChange={(event) => setExpiresIn(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2"
            >
              {expiryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            Maximum downloads <span className="text-gray-500">(optional, 1-1000)</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={maxDownloads}
              onChange={(event) => setMaxDownloads(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Password <span className="text-gray-500">(optional)</span>
            <input
              type="password"
              maxLength="128"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2"
            />
          </label>
          <button disabled={busy} className="w-full rounded-lg bg-[#B7F542] px-4 py-2.5 font-semibold text-black disabled:opacity-50">
            {busy ? "Working..." : "Create link"}
          </button>
        </form>

        {createdUrl && (
          <div className="mt-4 rounded-xl border border-[#526b22] bg-[#1b2410] p-4">
            <p className="mb-2 text-sm font-semibold text-[#B7F542]">This link is shown only once.</p>
            <div className="flex gap-2">
              <input readOnly value={createdUrl} aria-label="New share link" className="min-w-0 flex-1 rounded-lg bg-black/30 px-3 py-2 text-sm" />
              <button onClick={copyLink} className="flex shrink-0 items-center gap-2 rounded-lg bg-[#B7F542] px-3 py-2 text-sm font-semibold text-black">
                <Copy size={16} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Existing links</h3>
          {shares.length === 0 ? (
            <p className="text-sm text-gray-500">No links created for this file.</p>
          ) : (
            <ul className="space-y-3">
              {shares.map((share) => (
                <li key={share.shareId} className="rounded-xl border border-[#292929] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-medium capitalize">{share.status}{share.hasPassword ? " · password protected" : ""}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Expires {new Date(share.expiresAt).toLocaleString()} · {share.downloadCount} downloads
                        {share.maxDownloads ? ` / ${share.maxDownloads}` : ""}
                      </p>
                    </div>
                    {share.status !== "revoked" && (
                      <button
                        disabled={busy}
                        onClick={() => revokeLink(share.shareId)}
                        className="rounded-lg border border-[#444] px-3 py-2 text-sm text-gray-300 hover:border-red-700 hover:text-red-300 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
          <Link2 size={14} /> Anyone holding an active link can download this file.
        </div>
      </section>
    </div>
  );
}

export default ShareDialog;
