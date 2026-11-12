
import { useRef, useState } from "react";
import {
  UploadCloud,
  File,
  FileText,
  Image,
  FileArchive,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";

function FileUpload() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return Image;
    if (fileType.includes("pdf") || fileType.includes("text")) return FileText;
    if (fileType.includes("zip") || fileType.includes("compressed")) {
      return FileArchive;
    }

    return File;
  };

  const addFiles = (newFiles) => {
    const selectedFiles = Array.from(newFiles).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      status: "Ready",
    }));

    setFiles((previousFiles) => {
      const existingIds = new Set(previousFiles.map((item) => item.id));

      const uniqueFiles = selectedFiles.filter(
        (item) => !existingIds.has(item.id)
      );

      return [...previousFiles, ...uniqueFiles];
    });
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    addFiles(event.dataTransfer.files);
  };

  const removeFile = (id) => {
    setFiles((previousFiles) =>
      previousFiles.filter((item) => item.id !== id)
    );
  };

  const handleUpload = () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);

    setFiles((previousFiles) =>
      previousFiles.map((item) => ({
        ...item,
        status: "Uploading",
      }))
    );

    setTimeout(() => {
      setFiles((previousFiles) =>
        previousFiles.map((item) => ({
          ...item,
          status: "Uploaded",
        }))
      );

      setIsUploading(false);
    }, 2000);
  };

  return (
    <section
      id="upload"
      className="w-full bg-[#0A0A0A] text-white py-24 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[#B7F542] font-semibold tracking-widest uppercase text-sm">
            File Upload
          </span>

          <h2 className="mt-4 text-3xl md:text-5xl font-bold">
            Upload Your Files
          </h2>

          <p className="mt-5 text-gray-400 text-base md:text-lg">
            Drag and drop your files here or browse your device
            to get started with Storvex.
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-12 border-2 border-dashed rounded-2xl p-10 md:p-16 text-center transition-all duration-300 ${
            isDragging
              ? "border-[#B7F542] bg-[#B7F542]/10"
              : "border-[#333333] bg-[#141414] hover:border-[#B7F542]/60"
          }`}
        >
          <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-[#B7F542]/10 text-[#B7F542]">
            <UploadCloud size={42} strokeWidth={1.5} />
          </div>

          <h3 className="mt-6 text-xl md:text-2xl font-semibold">
            {isDragging ? "Drop your files here" : "Drag and drop your files"}
          </h3>

          <p className="mt-3 text-gray-400">
            or click the button below to browse files
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current.click()}
            className="mt-7 px-7 py-3 bg-[#B7F542] text-black font-semibold rounded-lg hover:bg-[#A6E632] transition-all duration-300"
          >
            Browse Files
          </button>

          <p className="mt-5 text-xs text-gray-500">
            Select multiple files from your device
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold">
                Selected Files
                <span className="ml-3 text-sm text-gray-400">
                  ({files.length})
                </span>
              </h3>

              <button
                onClick={() => setFiles([])}
                disabled={isUploading}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3">
              {files.map((item) => {
                const Icon = getFileIcon(item.file.type);

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#141414] border border-[#262626]"
                  >
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg bg-[#B7F542]/10 text-[#B7F542]">
                      <Icon size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.file.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status === "Uploaded" ? (
                        <span className="flex items-center gap-1 text-xs text-[#B7F542]">
                          <CheckCircle2 size={16} />
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {item.status}
                        </span>
                      )}

                      <button
                        onClick={() => removeFile(item.id)}
                        disabled={isUploading}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading || files.every((item) => item.status === "Uploaded")}
              className="w-full mt-6 py-4 bg-[#B7F542] text-black font-semibold rounded-xl hover:bg-[#A6E632] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isUploading ? "Uploading Files..." : "Upload Files"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FileUpload;
