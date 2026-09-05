import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";

function PdfPreviewThumbnail({ file, isDark = false, className = "" }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!file?.id) {
        setLoading(false);
        setFailed(true);
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
          throw new Error("PDF preview URL was not returned.");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Unable to load PDF preview:", error);

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
  }, [file?.id]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        isDark ? "bg-slate-800" : "bg-slate-100"
      } ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-red-500" />
        </div>
      )}

      {!loading && !failed && previewUrl && (
        <iframe
          src={`${previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title={`${file?.name || "PDF"} preview`}
          loading="lazy"
          className="pointer-events-none h-[210%] w-full origin-top scale-[0.48] border-0 bg-white"
          onLoad={() => setFailed(false)}
        />
      )}

      {!loading && (failed || !previewUrl) && (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
            <FileText size={30} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfPreviewThumbnail;
