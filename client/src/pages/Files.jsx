import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const maxSize = 500 * 1024 * 1024;
const readable = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

function downloadName(header, fallback) {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  return encoded ? decodeURIComponent(encoded) : fallback;
}

export default function Files() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [providerHealth, setProviderHealth] = useState([]);
  const [demoEnabled, setDemoEnabled] = useState(false);

  const load = async () => {
    try {
      const nextFiles = (await api.get("/files")).data.files;
      const withHealth = await Promise.all(nextFiles.map(async (file) => {
        try { return { ...file, health: (await api.get(`/files/${file.id}/health`)).data.health }; }
        catch { return { ...file, health: { status: "unrecoverable" } }; }
      }));
      setFiles(withHealth);
    } catch {
      setError("Unable to load your files.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (user?.role !== "admin") return;
    api.get("/admin/providers").then((response) => {
      setProviderHealth(response.data.providers);
      setDemoEnabled(response.data.providers.some((provider) => provider.faultMode && provider.faultMode !== "disabled"));
    }).catch(() => {});
  }, [user]);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > maxSize) { setError("This file is larger than the 500 MB limit."); return; }
    setBusy(true); setError(""); setProgress(0);
    try {
      const body = new FormData();
      body.append("file", file);
      await api.post("/files/upload", body, {
        headers: { "Content-Type": undefined },
        onUploadProgress: (event) => setProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
      });
      await load();
    } catch (requestError) { setError(requestError.response?.data?.message || "Upload failed."); }
    finally { setBusy(false); }
  };

  const download = async (file) => {
    setSelected(file.id); setError("");
    try {
      const response = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName(response.headers["content-disposition"], file.name);
      anchor.click();
      URL.revokeObjectURL(url);
      // Very large downloads may later move to short-lived signed download tokens.
    } catch { setError("Download failed."); }
    finally { setSelected(null); }
  };

  const remove = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try { await api.delete(`/files/${file.id}`); setFiles((current) => current.filter((item) => item.id !== file.id)); }
    catch { setError("Delete failed."); }
  };

  const setFault = async (index, mode) => {
    try {
      await api.post(`/admin/providers/${index}/fault`, { mode });
      const response = await api.get("/admin/providers");
      setProviderHealth(response.data.providers);
      setDemoEnabled(true);
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to change provider state."); }
  };

  const runRepair = async () => {
    try { await api.post("/admin/repair/run"); await load(); }
    catch { setError("Repair could not be completed."); }
  };

  return (
    <main className="dashboard">
      <section className="files-page">
        <h1>My files</h1>
        <label className="upload-area" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files[0]); }}>
          <strong>Drop a file here</strong>
          <span>or choose a file from your device</span>
          <input ref={inputRef} type="file" hidden onChange={(event) => upload(event.target.files[0])} />
          <button className="button primary" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>Choose file</button>
        </label>
        {busy && <progress className="upload-progress" value={progress} max="100" />}
        {error && <p className="server-error">{error}</p>}
        {loading ? <p className="empty-files">Loading your files...</p> : !files.length ? <p className="empty-files">No files uploaded yet.</p> : (
          <div className="file-table">
            {files.map((file) => (
              <div className="file-row" key={file.id}>
                <div><strong>{file.name}</strong><small>{readable(file.size)} · {new Date(file.createdAt).toLocaleString()}</small><span className={`health-badge ${file.health?.status || "unrecoverable"}`}>{file.health?.status || "Unrecoverable"}</span></div>
                <div className="file-actions">
                  <button className="button secondary" type="button" onClick={() => download(file)} disabled={selected === file.id}>{selected === file.id ? "Downloading..." : "Download"}</button>
                  <button className="button danger" type="button" onClick={() => remove(file)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {user?.role === "admin" && demoEnabled && <aside className="demo-panel">
          <strong>Provider failure demo</strong>
          {providerHealth.map((provider) => <div key={provider.index}>
            <span>Provider {provider.index + 1}</span>
            {["offline", "corrupt", "none"].map((mode) => <button className="button secondary" type="button" key={mode} onClick={() => setFault(provider.index, mode)}>{mode === "none" ? "Normal" : mode}</button>)}
          </div>)}
          <button className="button primary" type="button" onClick={runRepair}>Run repair</button>
        </aside>}
      </section>
    </main>
  );
}
