import { FileImage, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

function getExtension(name = "") {
  const clean = String(name).toLowerCase().trim();
  const dot = clean.lastIndexOf(".");
  if (dot <= 0 || dot === clean.length - 1) return "";
  return clean.slice(dot + 1);
}

function isImageFile(file) {
  const extension = getExtension(file?.name);
  const mimeType = String(file?.mimeType || file?.mime_type || "").toLowerCase();

  return (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tif", "tiff"].includes(extension)
  );
}

function FilePreviewThumbnail({ file, isDark = false, className = "" }) {
  const image = useMemo(() => isImageFile(file), [file]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(image);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!image || !file?.id) {
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
          throw new Error("Preview URL was not returned.");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Unable to load image preview:", error);

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
  }, [file?.id, image]);

  if (!image) return null;

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        isDark ? "bg-slate-800" : "bg-slate-100"
      } ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-violet-500" />
        </div>
      )}

      {!loading && !failed && previewUrl && (
        <img
          src={previewUrl}
          alt={file?.name || "Image preview"}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}

      {!loading && (failed || !previewUrl) && (
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
            isDark
              ? "bg-slate-900 text-pink-400"
              : "bg-white text-pink-600"
          }`}
        >
          <FileImage size={30} />
        </div>
      )}
    </div>
  );
}

export default FilePreviewThumbnail;