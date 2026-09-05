import { FileAudio, FileVideo, Loader2, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

function getExtension(name = "") {
  const clean = String(name).toLowerCase().trim();
  const dot = clean.lastIndexOf(".");
  if (dot <= 0 || dot === clean.length - 1) return "";
  return clean.slice(dot + 1);
}

function getMediaKind(file) {
  const extension = getExtension(file?.name);
  const mimeType = String(file?.mimeType || file?.mime_type || "").toLowerCase();

  if (
    mimeType.startsWith("video/") ||
    ["mp4", "mov", "avi", "mkv", "webm", "m4v", "mpeg", "mpg"].includes(extension)
  ) {
    return "video";
  }

  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "m4a", "aac", "flac", "ogg"].includes(extension)
  ) {
    return "audio";
  }

  return null;
}

function MediaPreviewThumbnail({ file, isDark = false, className = "" }) {
  const mediaKind = useMemo(() => getMediaKind(file), [file]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(Boolean(mediaKind));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!mediaKind || !file?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setFailed(false);

        const response = await api.get(`/files/${file.id}`);

        const url =
          response.data?.signedUrl ||
          response.data?.downloadUrl ||
          response.data?.url ||
          response.data?.file?.signedUrl ||
          response.data?.file?.downloadUrl ||
          response.data?.file?.url ||
          "";

        if (!url) {
          throw new Error("Media preview URL was not returned.");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Unable to load media preview:", error);

        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [file?.id, mediaKind]);

  if (!mediaKind) return null;

  if (loading) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          isDark ? "bg-slate-800" : "bg-slate-100"
        } ${className}`}
      >
        <Loader2 size={24} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (failed || !previewUrl) {
    const Icon = mediaKind === "video" ? FileVideo : FileAudio;

    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          mediaKind === "video"
            ? "bg-gradient-to-br from-purple-50 to-violet-100"
            : "bg-gradient-to-br from-cyan-50 to-sky-100"
        } ${className}`}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${
            mediaKind === "video" ? "text-purple-600" : "text-cyan-600"
          }`}
        >
          <Icon size={30} />
        </div>
      </div>
    );
  }

  if (mediaKind === "video") {
    return (
      <div className={`relative h-full w-full overflow-hidden bg-slate-950 ${className}`}>
        <video
          src={previewUrl}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
            <Play size={18} fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100 ${className}`}
    >
      <div className="absolute inset-x-4 flex items-end justify-center gap-1 opacity-70">
        {[20, 34, 48, 30, 54, 40, 24, 44, 32, 50, 28, 38].map((height, index) => (
          <span
            key={index}
            className="w-1.5 rounded-full bg-cyan-500"
            style={{ height }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-cyan-600 shadow-md">
        <FileAudio size={26} />
      </div>
    </div>
  );
}

export default MediaPreviewThumbnail;
