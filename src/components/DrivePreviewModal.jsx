import { Download, ExternalLink, FileArchive, FileCode2, FileText, Image as ImageIcon, Loader2, Music, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

function getExtension(name = "") {
  const value = String(name).toLowerCase().trim();
  const dot = value.lastIndexOf(".");
  if (dot <= 0 || dot === value.length - 1) return "";
  return value.slice(dot + 1);
}

function getPreviewKind(file) {
  const extension = getExtension(file?.name);
  const mimeType = String(file?.mimeType || file?.mime_type || "").toLowerCase();

  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tif", "tiff"].includes(extension)) return "image";
  if (mimeType === "application/pdf" || extension === "pdf") return "pdf";
  if (mimeType.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm", "m4v", "mpeg", "mpg"].includes(extension)) return "video";
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "flac", "ogg"].includes(extension)) return "audio";
  if (["doc", "docx", "odt", "rtf"].includes(extension)) return "word";
  if (["xls", "xlsx", "xlsm", "ods", "csv"].includes(extension)) return "excel";
  if (["ppt", "pptx", "odp"].includes(extension)) return "powerpoint";
  if (["js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "cs", "go", "rs", "php", "html", "css", "json", "xml", "sql", "sh"].includes(extension)) return "code";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "archive";
  if (mimeType.startsWith("text/") || ["txt", "md", "log"].includes(extension)) return "text";
  return "other";
}

function UnsupportedPreview({ file, kind, isDark }) {
  const extension = getExtension(file?.name).toUpperCase() || "FILE";

  const config = {
    word: { icon: FileText, title: "Word document", detail: "Browser preview is not available for this file format." },
    excel: { icon: FileText, title: "Spreadsheet file", detail: "Browser preview is not available for this file format." },
    powerpoint: { icon: FileText, title: "Presentation file", detail: "Browser preview is not available for this file format." },
    code: { icon: FileCode2, title: "Code file", detail: "Use Open in new tab or download the file to view it." },
    archive: { icon: FileArchive, title: "Archive file", detail: "Archive contents are not previewed inside Cloud Drive." },
    text: { icon: FileText, title: "Text file", detail: "Use Open in new tab to view the complete file." },
    other: { icon: FileText, title: "Preview unavailable", detail: "This file type does not have an in-app preview yet." },
  }[kind] || { icon: FileText, title: "Preview unavailable", detail: "This file type does not have an in-app preview yet." };

  const Icon = config.icon;

  return (
    <div className={`flex h-full w-full items-center justify-center p-8 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
      <div className={`w-full max-w-md rounded-3xl border p-8 text-center shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${isDark ? "bg-slate-800 text-violet-300" : "bg-violet-50 text-violet-600"}`}>
          <Icon size={38} />
        </div>

        <div className="mt-5">
          <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-extrabold tracking-wider ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            {extension}
          </span>
        </div>

        <h3 className={`mt-4 text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          {config.title}
        </h3>

        <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {config.detail}
        </p>
      </div>
    </div>
  );
}

function DrivePreviewModal({ file, isDark = false, onClose, onDownload }) {
  const kind = useMemo(() => getPreviewKind(file), [file]);
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUrl() {
      if (!file?.id) {
        setFailed(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setFailed(false);

        const response = await api.get(`/files/${file.id}`);
        const url =
          response.data?.downloadUrl ||
          response.data?.signedUrl ||
          response.data?.url ||
          response.data?.file?.downloadUrl ||
          response.data?.file?.signedUrl ||
          response.data?.file?.url ||
          "";

        if (!url) throw new Error("Preview URL was not returned.");

        if (!cancelled) setFileUrl(url);
      } catch (error) {
        console.error("Unable to load file preview:", error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUrl();

    return () => {
      cancelled = true;
    };
  }, [file?.id]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleOpenInNewTab() {
    try {
      setOpening(true);

      let url = fileUrl;

      if (!url) {
        const response = await api.get(`/files/${file.id}`);
        url =
          response.data?.downloadUrl ||
          response.data?.signedUrl ||
          response.data?.url ||
          response.data?.file?.downloadUrl ||
          response.data?.file?.signedUrl ||
          response.data?.file?.url ||
          "";
      }

      if (!url) throw new Error("File URL was not returned.");

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Unable to open file in new tab:", error);
      setFailed(true);
    } finally {
      setOpening(false);
    }
  }

  let previewContent = null;

  if (loading) {
    previewContent = (
      <div className={`flex h-full w-full items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-violet-500" />
          <p className={`mt-4 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading preview…</p>
        </div>
      </div>
    );
  } else if (failed || !fileUrl) {
    previewContent = (
      <div className={`flex h-full w-full items-center justify-center p-8 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
        <div className={`max-w-sm rounded-3xl border p-8 text-center ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <FileText size={42} className="mx-auto text-slate-400" />
          <h3 className={`mt-4 font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Preview couldn't be loaded</h3>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>You can still try opening or downloading the file.</p>
        </div>
      </div>
    );
  } else if (kind === "image") {
    previewContent = (
      <div className={`flex h-full w-full items-center justify-center p-5 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
        <img src={fileUrl} alt={file?.name || "Preview"} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
      </div>
    );
  } else if (kind === "pdf") {
    previewContent = (
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0`}
        title={`${file?.name || "PDF"} preview`}
        className="h-full w-full border-0 bg-white"
      />
    );
  } else if (kind === "video") {
    previewContent = (
      <div className="flex h-full w-full items-center justify-center bg-black p-4">
        <video src={fileUrl} controls autoPlay={false} playsInline className="max-h-full max-w-full rounded-xl" />
      </div>
    );
  } else if (kind === "audio") {
    previewContent = (
      <div className={`flex h-full w-full items-center justify-center p-8 ${isDark ? "bg-slate-950" : "bg-gradient-to-br from-cyan-50 via-white to-blue-50"}`}>
        <div className={`w-full max-w-lg rounded-3xl border p-8 text-center shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-cyan-100 bg-white"}`}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">
            <Music size={38} />
          </div>
          <p className={`mt-5 truncate text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{file?.name}</p>
          <audio src={fileUrl} controls className="mt-6 w-full" />
        </div>
      </div>
    );
  } else {
    previewContent = <UnsupportedPreview file={file} kind={kind} isDark={isDark} />;
  }

  const KindIcon =
    kind === "image" ? ImageIcon :
    kind === "video" ? Video :
    kind === "audio" ? Music :
    FileText;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/70 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <div className={`flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6 ${isDark ? "border-slate-800 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-slate-800 text-violet-300" : "bg-violet-50 text-violet-600"}`}>
          <KindIcon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{file?.name || "File preview"}</p>
          <p className={`mt-0.5 text-[11px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {getExtension(file?.name) || kind}
          </p>
        </div>

        <button type="button" onClick={() => onDownload?.(file)} className={`hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}>
          <Download size={17} />
          Download
        </button>

        <button type="button" disabled={opening} onClick={handleOpenInNewTab} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${isDark ? "bg-violet-500/15 text-violet-200 hover:bg-violet-500/25" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
          {opening ? <Loader2 size={17} className="animate-spin" /> : <ExternalLink size={17} />}
          <span className="hidden sm:inline">Open in new tab</span>
        </button>

        <button type="button" onClick={onClose} className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`} aria-label="Close preview">
          <X size={22} />
        </button>
      </div>

      <div className="min-h-0 flex-1">{previewContent}</div>
    </div>
  );
}

export default DrivePreviewModal;
