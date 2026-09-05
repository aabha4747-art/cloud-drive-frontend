import {
  ArrowLeft,
  Check,
  FileText,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";

function DocumentEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    documentId,
  } = useParams();

  // ======================================================
  // DOCUMENT STATE
  // ======================================================

  const [
    document,
    setDocument,
  ] = useState(null);

  const [
    content,
    setContent,
  ] = useState("");

  const [
    originalContent,
    setOriginalContent,
  ] = useState("");

  // ======================================================
  // STATUS
  // ======================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // ======================================================
  // LOAD DOCUMENT
  // ======================================================

  const loadDocument =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/files/documents/${documentId}`
            );

          const loadedDocument =
            response.data
              ?.document;

          if (!loadedDocument) {
            throw new Error(
              "Document data was not returned"
            );
          }

          setDocument(
            loadedDocument
          );

          setContent(
            loadedDocument.content ||
              ""
          );

          setOriginalContent(
            loadedDocument.content ||
              ""
          );
        } catch (err) {
          console.error(
            "Load document error:",
            err
          );

          if (
            err.response?.status ===
            401
          ) {
            localStorage.removeItem(
              "token"
            );

            localStorage.removeItem(
              "user"
            );

            navigate("/login");

            return;
          }

          setError(
            err.response?.data
              ?.error?.message ||
              err.response?.data
                ?.message ||
              err.message ||
              "Unable to load document."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        documentId,
        navigate,
      ]
    );

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // ======================================================
  // SAVE DOCUMENT
  // ======================================================

  const handleSave =
    async () => {
      if (
        !document?.canEdit
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/files/documents/${documentId}/content`,
            {
              content,
            }
          );

        const updatedDocument =
          response.data
            ?.document;

        setOriginalContent(
          content
        );

        if (
          updatedDocument
        ) {
          setDocument(
            (current) => ({
              ...current,
              ...updatedDocument,
            })
          );
        }

        window.dispatchEvent(
  new Event(
    "cloud-drive-storage-changed"
  )
);

        setSuccess(
          "Document saved successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 2000);
      } catch (err) {
        console.error(
          "Save document error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to save document."
        );
      } finally {
        setSaving(false);
      }
    };

  // ======================================================
  // KEYBOARD SHORTCUT
  // CTRL + S
  // ======================================================

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      const isSaveShortcut =
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      if (
        document?.canEdit &&
        !saving
      ) {
        handleSave();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    content,
    document?.canEdit,
    saving,
  ]);

  // ======================================================
  // BACK
  // ======================================================

  const handleBack = () => {
    const returnTo =
      location.state
        ?.returnTo;

    if (returnTo) {
      navigate(
        returnTo,
        {
          state:
            location.state
              ?.returnState ||
            {},
        }
      );

      return;
    }

    navigate(
      "/dashboard"
    );
  };

  // ======================================================
  // DIRTY STATE
  // ======================================================

  const hasUnsavedChanges =
    content !==
    originalContent;

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC]">

        <div className="text-center">

          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-violet-500"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading document...
          </p>

        </div>

      </div>
    );
  }

  // ======================================================
  // ERROR ONLY
  // ======================================================

  if (
    error &&
    !document
  ) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] px-6 py-10">

        <div className="mx-auto max-w-3xl">

          <button
            type="button"
            onClick={
              handleBack
            }
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-600"
          >
            <ArrowLeft
              size={18}
            />

            Back
          </button>

          <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center">

            <p className="font-semibold text-red-600">
              {error}
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-[#F6F8FC]">

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">

        <div className="flex min-h-[76px] items-center justify-between gap-4 px-5 lg:px-8">

          <div className="flex min-w-0 items-center gap-4">

            <button
              type="button"
              onClick={
                handleBack
              }
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-violet-600"
            >
              <ArrowLeft
                size={21}
              />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">

              <FileText
                size={22}
              />

            </div>

            <div className="min-w-0">

              <h1 className="truncate text-lg font-bold text-slate-900">
                {document?.name ||
                  "Document"}
              </h1>

              <div className="mt-1 flex items-center gap-2">

                {document?.canEdit ? (
                  <>
                    {hasUnsavedChanges ? (
                      <span className="text-xs font-medium text-amber-500">
                        Unsaved changes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check
                          size={13}
                        />

                        Saved
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    View only
                  </span>
                )}

              </div>

            </div>

          </div>

          <div className="flex items-center gap-3">

            {document?.permission &&
              document.permission !==
                "owner" && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-500">
                  {
                    document.permission
                  }
                </span>
              )}

            {document?.canEdit && (
              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving ||
                  !hasUnsavedChanges
                }
                className="flex min-w-[110px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={16}
                    />

                    Save
                  </>
                )}
              </button>
            )}

          </div>

        </div>

      </header>

      {/* ==================================================
          BODY
      ================================================== */}

      <main className="px-4 py-8 sm:px-6 lg:px-10">

        <div className="mx-auto max-w-5xl">

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* DOCUMENT PAGE */}

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">

            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3">

              <div className="flex items-center justify-between">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Cloud Document
                </p>

                <p className="text-xs text-slate-400">
                  {formatFileSize(
                    document?.sizeBytes
                  )}
                </p>

              </div>

            </div>

            <textarea
              value={
                content
              }
              onChange={(event) =>
                setContent(
                  event.target
                    .value
                )
              }
              readOnly={
                !document?.canEdit
              }
              spellCheck
              placeholder={
                document?.canEdit
                  ? "Start writing..."
                  : "This document is empty."
              }
              className={`
                min-h-[70vh]
                w-full
                resize-none
                bg-white
                px-10
                py-10
                text-[17px]
                leading-8
                text-slate-800
                outline-none
                sm:px-14
                lg:px-20

                ${
                  document?.canEdit
                    ? "cursor-text"
                    : "cursor-default bg-slate-50/30"
                }
              `}
            />

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-slate-400">

            <span>
              {content.length} characters
            </span>

            {document?.canEdit && (
              <span>
                Ctrl + S to save
              </span>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}

// ======================================================
// FILE SIZE
// ======================================================

function formatFileSize(
  bytes
) {
  const value =
    Number(bytes || 0);

  if (value === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.min(
      Math.floor(
        Math.log(value) /
          Math.log(1024)
      ),
      units.length - 1
    );

  const size =
    value /
    Math.pow(
      1024,
      index
    );

  return `${size.toFixed(
    index === 0
      ? 0
      : size < 10
        ? 2
        : 1
  )} ${units[index]}`;
}

export default DocumentEditorPage;