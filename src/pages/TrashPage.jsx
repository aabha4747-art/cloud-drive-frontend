import { ArrowLeft, Check, MoreVertical, RefreshCw, RotateCcw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import api from "../api/axios";
import DriveDropOverlay from "../components/DriveDropOverlay";
import DriveToolbar from "../components/DriveToolbar";
import useDriveDragDrop from "../hooks/useDriveDragDrop";
import { getItemDisplayName, getItemTypeConfig, getItemTypeKey } from "../utils/fileTypeConfig";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "folder", label: "Folders" },
  { value: "project", label: "Projects" },
  { value: "document", label: "Cloud Documents" },
  { value: "spreadsheet", label: "Cloud Spreadsheets" },
  { value: "presentation", label: "Cloud Presentations" },
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
  { value: "excel", label: "Excel" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "archive", label: "Archives" },
  { value: "text", label: "Text" },
  { value: "code", label: "Code" },
  { value: "other", label: "Other files" }
];

function TrashPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setSystemDark(event.matches);

    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  const isDark =
    settings?.theme === "dark" ||
    (settings?.theme === "system" && systemDark);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [viewMode, setViewMode] = useState(
    () =>
      localStorage.getItem("trashViewMode") ||
      settings?.defaultView ||
      "grid"
  );

  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("trashViewMode", mode);
  };

  const [selectedItems, setSelectedItems] = useState([]);
  const selectionAreaRef = useRef(null);
  const dragBaseSelectionRef = useRef([]);
  const [dragSelection, setDragSelection] = useState(null);

  const [restoringSelected, setRestoringSelected] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);

  const [trashingDroppedItems, setTrashingDroppedItems] = useState(false);

  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/files/trash");

      setFiles(response.data.files || []);
      setFolders(response.data.folders || []);
    } catch (err) {
      console.error("Load trash error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to load Trash."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const filteredFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return folders.filter((folder) => {
      const matchesSearch =
        !query ||
        String(folder.name || "")
          .toLowerCase()
          .includes(query);

      const folderType =
        folder.isProject || folder.is_project
          ? "project"
          : "folder";

      const matchesType =
        typeFilter === "all" ||
        typeFilter === folderType;

      return matchesSearch && matchesType;
    });
  }, [folders, searchQuery, typeFilter]);

  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return files.filter((file) => {
      const displayName = getItemDisplayName(file);

      const matchesSearch =
        !query ||
        String(displayName || "")
          .toLowerCase()
          .includes(query);

      const fileType = getItemTypeKey(file, "file");

      const matchesType =
        typeFilter === "all" ||
        typeFilter === fileType;

      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, typeFilter]);

  const trashIsEmpty =
    files.length === 0 &&
    folders.length === 0;

  const noMatches =
    !loading &&
    !trashIsEmpty &&
    filteredFolders.length === 0 &&
    filteredFiles.length === 0;

  const totalFilteredItems =
    filteredFolders.length +
    filteredFiles.length;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSelectedItems([]);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setSelectedItems([]);
  };

  const getSelectionKey = (resourceType, item) =>
    `${resourceType}:${item.id}`;

  const isItemSelected = (resourceType, item) => {
    const key = getSelectionKey(resourceType, item);

    return selectedItems.some(
      (selected) => selected.key === key
    );
  };

  const handleToggleSelection = (resourceType, item) => {
    const key = getSelectionKey(resourceType, item);

    setSelectedItems((current) => {
      const exists = current.some(
        (selected) => selected.key === key
      );

      if (exists) {
        return current.filter(
          (selected) => selected.key !== key
        );
      }

      return [
        ...current,
        {
          key,
          resourceType,
          item
        }
      ];
    });
  };

  const getSelectionRecordFromKey = (key) => {
    if (!key) return null;

    const [resourceType, id] = key.split(":");

    if (resourceType === "folder") {
      const item = filteredFolders.find(
        (folder) => String(folder.id) === String(id)
      );

      return item
        ? {
            key: `folder:${item.id}`,
            resourceType: "folder",
            item
          }
        : null;
    }

    const item = filteredFiles.find(
      (file) => String(file.id) === String(id)
    );

    return item
      ? {
          key: `file:${item.id}`,
          resourceType: "file",
          item
        }
      : null;
  };

  const handleSelectionPointerDown = (event) => {
    if (event.button !== 0) return;

    if (
      event.target.closest(
        "button, input, textarea, select, a, [data-no-marquee='true'], [draggable='true']"
      )
    ) {
      return;
    }

    const container = selectionAreaRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    dragBaseSelectionRef.current =
      event.ctrlKey || event.metaKey
        ? [...selectedItems]
        : [];

    if (!event.ctrlKey && !event.metaKey) {
      setSelectedItems([]);
    }

    setDragSelection({
      pointerId: event.pointerId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      moved: false
    });

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional.
    }
  };

  const handleSelectionPointerMove = (event) => {
    if (!dragSelection) return;

    const container = selectionAreaRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const moved =
      dragSelection.moved ||
      Math.abs(currentX - dragSelection.startX) > 4 ||
      Math.abs(currentY - dragSelection.startY) > 4;

    const next = {
      ...dragSelection,
      currentX,
      currentY,
      moved
    };

    setDragSelection(next);

    if (!moved) return;

    const left =
      Math.min(next.startX, currentX) +
      rect.left;

    const right =
      Math.max(next.startX, currentX) +
      rect.left;

    const top =
      Math.min(next.startY, currentY) +
      rect.top;

    const bottom =
      Math.max(next.startY, currentY) +
      rect.top;

    const nodes = container.querySelectorAll(
      "[data-selectable-item='true']"
    );

    const merged = new Map();

    dragBaseSelectionRef.current.forEach((record) => {
      merged.set(record.key, record);
    });

    nodes.forEach((node) => {
      const itemRect = node.getBoundingClientRect();

      const intersects =
        itemRect.right >= left &&
        itemRect.left <= right &&
        itemRect.bottom >= top &&
        itemRect.top <= bottom;

      if (!intersects) return;

      const key = node.getAttribute("data-selection-key");
      const record = getSelectionRecordFromKey(key);

      if (record) {
        merged.set(record.key, record);
      }
    });

    setSelectedItems(
      Array.from(merged.values())
    );
  };

  const handleSelectionPointerUp = (event) => {
    if (!dragSelection) return;

    try {
      event.currentTarget.releasePointerCapture(
        dragSelection.pointerId
      );
    } catch {
      // Pointer capture is optional.
    }

    setDragSelection(null);
  };

  const handleRestoreFile = async (file) => {
    try {
      setError("");
      setMessage("");

      await api.post(`/files/${file.id}/restore`);

      setMessage(
        `"${getItemDisplayName(file)}" restored successfully.`
      );

      await loadTrash();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to restore file."
      );
    }
  };

  const handleRestoreFolder = async (folder) => {
    try {
      setError("");
      setMessage("");

      await api.post(`/folders/${folder.id}/restore`);

      setMessage(
        `"${folder.name}" restored successfully.`
      );

      await loadTrash();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to restore folder."
      );
    }
  };

  const handlePermanentDeleteFile = async (file) => {
    const confirmed = window.confirm(
      `Permanently delete "${getItemDisplayName(file)}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/files/${file.id}/permanent`);

      setMessage(
        `"${getItemDisplayName(file)}" permanently deleted.`
      );

      window.dispatchEvent(
        new Event("cloud-drive-storage-changed")
      );

      await loadTrash();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to permanently delete file."
      );
    }
  };

  const handlePermanentDeleteFolder = async (folder) => {
    const confirmed = window.confirm(
      `Permanently delete "${folder.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/folders/${folder.id}/permanent`);

      setMessage(
        `"${folder.name}" permanently deleted.`
      );

      window.dispatchEvent(
        new Event("cloud-drive-storage-changed")
      );

      await loadTrash();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to permanently delete folder."
      );
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedItems.length === 0) return;

    try {
      setRestoringSelected(true);
      setError("");
      setMessage("");

      const results = await Promise.allSettled(
        selectedItems.map((selected) => {
          if (selected.resourceType === "folder") {
            return api.post(
              `/folders/${selected.item.id}/restore`
            );
          }

          return api.post(
            `/files/${selected.item.id}/restore`
          );
        })
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      const restoredCount =
        results.length - failed.length;

      setSelectedItems([]);

      if (restoredCount > 0) {
        setMessage(
          `${restoredCount} item${
            restoredCount === 1 ? "" : "s"
          } restored.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be restored.`
        );
      }

      await loadTrash();
    } finally {
      setRestoringSelected(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      setDeletingSelected(true);
      setError("");
      setMessage("");

      const itemsToDelete = [...selectedItems];

      const results = await Promise.allSettled(
        itemsToDelete.map((selected) => {
          if (selected.resourceType === "folder") {
            return api.delete(
              `/folders/${selected.item.id}/permanent`
            );
          }

          return api.delete(
            `/files/${selected.item.id}/permanent`
          );
        })
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      const deletedCount =
        results.length - failed.length;

      setShowPermanentDeleteConfirm(false);
      setSelectedItems([]);

      if (deletedCount > 0) {
        setMessage(
          `${deletedCount} item${
            deletedCount === 1 ? "" : "s"
          } permanently deleted.`
        );

        window.dispatchEvent(
          new Event("cloud-drive-storage-changed")
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be deleted.`
        );
      }

      await loadTrash();
    } finally {
      setDeletingSelected(false);
    }
  };

  const handleInternalDropToTrash = useCallback(
    async (itemsToTrash) => {
      if (!itemsToTrash?.length) return;

      try {
        setTrashingDroppedItems(true);
        setError("");
        setMessage("");

        const results = await Promise.allSettled(
          itemsToTrash.map((entry) => {
            if (entry.resourceType === "folder") {
              return api.delete(
                `/folders/${entry.id}`
              );
            }

            return api.delete(
              `/files/${entry.id}`
            );
          })
        );

        const failed = results.filter(
          (result) => result.status === "rejected"
        );

        const trashedCount =
          results.length - failed.length;

        if (trashedCount > 0) {
          setMessage(
            `${trashedCount} item${
              trashedCount === 1 ? "" : "s"
            } moved to Trash.`
          );
        }

        if (failed.length > 0) {
          const firstError = failed[0]?.reason;

          setError(
            firstError?.response?.data?.error?.message ||
              firstError?.response?.data?.message ||
              `${failed.length} item${
                failed.length === 1 ? "" : "s"
              } could not be moved to Trash.`
          );
        }

        setSelectedItems([]);
        await loadTrash();
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            "Unable to move dropped items to Trash."
        );
      } finally {
        setTrashingDroppedItems(false);
      }
    },
    [loadTrash]
  );

  const handleExternalDropOnTrash = useCallback(async () => {
    setMessage("");
    setError(
      "Files and folders from your computer cannot be uploaded directly to Trash. Upload them to My Drive first."
    );
  }, []);

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop
  } = useDriveDragDrop({
    disabled: loading,
    onExternalDrop: handleExternalDropOnTrash,
    onInternalDrop: handleInternalDropToTrash
  });

  useEffect(() => {
    const handleDeleteKey = (event) => {
      const activeTag =
        document.activeElement?.tagName?.toLowerCase();

      const editing =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        document.activeElement?.isContentEditable;

      if (
        event.key === "Delete" &&
        !editing &&
        selectedItems.length > 0 &&
        !showPermanentDeleteConfirm
      ) {
        event.preventDefault();
        setShowPermanentDeleteConfirm(true);
      }
    };

    window.addEventListener("keydown", handleDeleteKey);

    return () => {
      window.removeEventListener(
        "keydown",
        handleDeleteKey
      );
    };
  }, [
    selectedItems,
    showPermanentDeleteConfirm
  ]);

  return (
    <div
      {...dropZoneProps}
      className={`relative min-h-screen transition-colors ${
        isDark
          ? "bg-slate-950"
          : "bg-[#F6F8FC]"
      }`}
    >
      <DriveDropOverlay
        isDark={isDark}
        visible={
          isExternalDragActive ||
          isInternalDragActive
        }
        processing={
          isProcessingDrop ||
          trashingDroppedItems
        }
        mode={
          isInternalDragActive
            ? "move"
            : "upload"
        }
        title={
          isInternalDragActive
            ? "Drop to move to Trash"
            : "Trash does not accept uploads"
        }
        description={
          isInternalDragActive
            ? "The dragged Cloud Drive files, folders, or projects will be moved to Trash."
            : "Computer files cannot be uploaded directly to Trash. Upload them to My Drive first."
        }
      />

      <main className="p-6 lg:p-10">
        <section
          className={`mx-auto max-w-[1600px] rounded-3xl border p-6 shadow-sm transition-colors lg:p-10 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className={`rounded-xl p-2 transition ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Back to My Drive"
            >
              <ArrowLeft size={24} />
            </button>

            <div>
              <h1
                className={`text-3xl font-bold ${
                  isDark
                    ? "text-slate-100"
                    : "text-slate-900"
                }`}
              >
                Trash
              </h1>

              <p
                className={`mt-1 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Restore files and folders or delete them permanently.
              </p>
            </div>
          </div>

          {!loading && !trashIsEmpty && (
            <div className="mb-7">
              <DriveToolbar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search deleted files and folders..."
                typeFilter={typeFilter}
                onTypeFilterChange={handleTypeFilterChange}
                typeOptions={TYPE_OPTIONS}
                viewMode={viewMode}
                onViewModeChange={changeViewMode}
                isDark={isDark}
              />
            </div>
          )}

          {!loading &&
            !trashIsEmpty &&
            !noMatches && (
              <div className="mb-6 flex items-center justify-between">
                <p
                  className={`text-xs font-bold uppercase tracking-[0.16em] ${
                    isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  Deleted items
                </p>

                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                    isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {totalFilteredItems}
                </span>
              </div>
            )}

          {selectedItems.length > 0 && (
            <div
              className={`mb-7 flex min-h-[62px] items-center gap-2 rounded-2xl border px-4 shadow-sm transition-colors ${
                isDark
                  ? "border-violet-500/30 bg-slate-800 text-slate-200"
                  : "border-violet-200 bg-violet-50 text-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  isDark
                    ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
                title="Clear selection"
              >
                <X size={22} />
              </button>

              <span
                className={`min-w-[105px] text-[15px] font-semibold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-700"
                }`}
              >
                {selectedItems.length} selected
              </span>

              <div
                className={`mx-2 h-7 w-px ${
                  isDark
                    ? "bg-slate-600"
                    : "bg-violet-200"
                }`}
              />

              <button
                type="button"
                disabled={
                  restoringSelected ||
                  deletingSelected
                }
                onClick={handleRestoreSelected}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition disabled:opacity-40 ${
                  isDark
                    ? "text-slate-300 hover:bg-blue-500/15 hover:text-blue-300"
                    : "text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                }`}
                title="Restore selected"
              >
                {restoringSelected ? (
                  <RefreshCw
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <RotateCcw size={20} />
                )}
              </button>

              <button
                type="button"
                disabled={
                  restoringSelected ||
                  deletingSelected
                }
                onClick={() =>
                  setShowPermanentDeleteConfirm(true)
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition disabled:opacity-40 ${
                  isDark
                    ? "text-slate-300 hover:bg-red-500/15 hover:text-red-300"
                    : "text-slate-600 hover:bg-red-100 hover:text-red-600"
                }`}
                title="Delete forever"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          {error && (
            <div
              className={`mb-6 rounded-xl border px-5 py-4 ${
                isDark
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-red-100 bg-red-50 text-red-600"
              }`}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className={`mb-6 rounded-xl border px-5 py-4 ${
                isDark
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-green-100 bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          {loading && (
            <div
              className={`py-16 text-center ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              <RefreshCw
                size={25}
                className="mx-auto mb-3 animate-spin text-violet-500"
              />

              Loading Trash...
            </div>
          )}

          {!loading && trashIsEmpty && (
            <div className="py-20 text-center">
              <Trash2
                size={48}
                className={`mx-auto mb-4 ${
                  isDark
                    ? "text-slate-700"
                    : "text-slate-300"
                }`}
              />

              <p
                className={`text-lg font-medium ${
                  isDark
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                Trash is empty.
              </p>

              <p
                className={`mt-2 text-sm ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Deleted files and folders will appear here.
              </p>
            </div>
          )}

          {!loading && noMatches && (
            <div
              className={`rounded-3xl border px-6 py-16 text-center ${
                isDark
                  ? "border-slate-800 bg-slate-950/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Trash2
                size={38}
                className={`mx-auto ${
                  isDark
                    ? "text-slate-700"
                    : "text-slate-300"
                }`}
              />

              <h2
                className={`mt-4 text-lg font-bold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-700"
                }`}
              >
                No matching deleted items
              </h2>

              <p
                className={`mt-2 text-sm ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Try another name or choose a different type.
              </p>
            </div>
          )}

          {!loading &&
            !trashIsEmpty &&
            !noMatches && (
              <div
                ref={selectionAreaRef}
                onPointerDown={handleSelectionPointerDown}
                onPointerMove={handleSelectionPointerMove}
                onPointerUp={handleSelectionPointerUp}
                onPointerCancel={handleSelectionPointerUp}
                className="relative select-none"
              >
                {dragSelection?.moved && (
                  <div
                    className={`pointer-events-none absolute z-[70] border ${
                      isDark
                        ? "border-violet-400 bg-violet-400/15"
                        : "border-violet-500 bg-violet-300/25"
                    }`}
                    style={{
                      left: Math.min(
                        dragSelection.startX,
                        dragSelection.currentX
                      ),
                      top: Math.min(
                        dragSelection.startY,
                        dragSelection.currentY
                      ),
                      width: Math.abs(
                        dragSelection.currentX -
                          dragSelection.startX
                      ),
                      height: Math.abs(
                        dragSelection.currentY -
                          dragSelection.startY
                      )
                    }}
                  />
                )}

                {filteredFolders.length > 0 && (
                  <div className="mb-10">
                    <SectionTitle
                      isDark={isDark}
                      count={filteredFolders.length}
                    >
                      Deleted Folders & Projects
                    </SectionTitle>

                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                          : `overflow-visible rounded-xl border ${
                              isDark
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`
                      }
                    >
                      {filteredFolders.map((folder) => (
                        <TrashCard
                          key={folder.id}
                          resourceType="folder"
                          item={folder}
                          selected={isItemSelected(
                            "folder",
                            folder
                          )}
                          viewMode={viewMode}
                          isDark={isDark}
                          onToggleSelect={() =>
                            handleToggleSelection(
                              "folder",
                              folder
                            )
                          }
                          onRestore={() =>
                            handleRestoreFolder(folder)
                          }
                          onDelete={() =>
                            handlePermanentDeleteFolder(
                              folder
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredFiles.length > 0 && (
                  <div>
                    <SectionTitle
                      isDark={isDark}
                      count={filteredFiles.length}
                    >
                      Deleted Files
                    </SectionTitle>

                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                          : `overflow-visible rounded-xl border ${
                              isDark
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`
                      }
                    >
                      {filteredFiles.map((file) => (
                        <TrashCard
                          key={file.id}
                          resourceType="file"
                          item={file}
                          selected={isItemSelected(
                            "file",
                            file
                          )}
                          viewMode={viewMode}
                          isDark={isDark}
                          onToggleSelect={() =>
                            handleToggleSelection(
                              "file",
                              file
                            )
                          }
                          onRestore={() =>
                            handleRestoreFile(file)
                          }
                          onDelete={() =>
                            handlePermanentDeleteFile(file)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </section>
      </main>

      {showPermanentDeleteConfirm && (
        <PermanentDeleteConfirmModal
          items={selectedItems}
          deleting={deletingSelected}
          isDark={isDark}
          onCancel={() => {
            if (deletingSelected) return;

            setShowPermanentDeleteConfirm(false);
          }}
          onConfirm={handleConfirmPermanentDelete}
        />
      )}
    </div>
  );
}

function SectionTitle({
  children,
  isDark,
  count
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h3
        className={`text-sm font-bold uppercase tracking-[0.12em] ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {children}
      </h3>

      {count !== undefined && (
        <span
          className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold ${
            isDark
              ? "bg-slate-800 text-slate-400"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function TrashCard({
  resourceType,
  item,
  selected,
  viewMode,
  isDark,
  onToggleSelect,
  onRestore,
  onDelete
}) {
  const config = getItemTypeConfig(
    item,
    resourceType
  );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon = config.icon;

  const displayName =
    resourceType === "file"
      ? getItemDisplayName(item)
      : item.name;

  if (viewMode === "list") {
    return (
      <div
        data-selectable-item="true"
        data-selection-key={`${resourceType}:${item.id}`}
        className={`group grid min-h-[68px] grid-cols-[48px_minmax(0,1fr)_160px_52px] items-center border-b px-4 transition last:border-b-0 ${
          isDark
            ? "border-slate-800"
            : "border-slate-100"
        } ${
          selected
            ? isDark
              ? "bg-violet-500/15 ring-1 ring-inset ring-violet-400/40"
              : "bg-violet-50 ring-1 ring-inset ring-violet-200"
            : isDark
              ? "bg-slate-900 hover:bg-slate-800/80"
              : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-center">
          <SelectionCheckbox
            selected={selected}
            isDark={isDark}
            onClick={onToggleSelect}
          />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
          >
            <Icon
              size={22}
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <p
              className={`truncate font-semibold ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-800"
              }`}
              title={displayName}
            >
              {displayName}
            </p>

            <span
              className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.06em] ${colors.badge}`}
            >
              {config.badge}
            </span>
          </div>
        </div>

        <div
          className={`text-sm ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          {resourceType === "folder"
            ? config.label
            : item.sizeBytes !== undefined
              ? formatFileSize(item.sizeBytes)
              : config.label}
        </div>

        <div className="flex justify-end">
          <TrashItemMenu
            isDark={isDark}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-selectable-item="true"
      data-selection-key={`${resourceType}:${item.id}`}
      className={`group relative overflow-visible rounded-2xl border p-4 transition-all duration-200 ${
        selected
          ? isDark
            ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25 shadow-lg shadow-violet-950/10"
            : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
          : isDark
            ? `bg-slate-900 ${colors.border} hover:bg-slate-800/80`
            : `bg-white ${colors.border} hover:shadow-md`
      }`}
    >
      <div className="absolute left-3 top-3 z-20">
        <SelectionCheckbox
          selected={selected}
          isDark={isDark}
          onClick={onToggleSelect}
        />
      </div>

      <div className="absolute right-3 top-3 z-20">
        <TrashItemMenu
          isDark={isDark}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </div>

      <div
        className={`mb-4 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br ${colors.preview}`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${
            isDark
              ? "bg-slate-900/90"
              : "bg-white/90"
          } ${colors.icon}`}
        >
          <Icon
            size={36}
            strokeWidth={1.8}
          />
        </div>
      </div>

      <p
        className={`truncate font-semibold ${
          isDark
            ? "text-slate-100"
            : "text-slate-800"
        }`}
        title={displayName}
      >
        {displayName}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.06em] ${colors.badge}`}
        >
          {config.badge}
        </span>

        <span
          className={`text-xs ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {resourceType === "folder"
            ? config.label
            : item.sizeBytes !== undefined
              ? formatFileSize(item.sizeBytes)
              : config.label}
        </span>
      </div>
    </div>
  );
}

function SelectionCheckbox({
  selected,
  isDark,
  onClick
}) {
  return (
    <button
      type="button"
      data-no-marquee="true"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
        selected
          ? "border-violet-500 bg-violet-500 text-white opacity-100 shadow-sm"
          : isDark
            ? "border-slate-600 bg-slate-800 text-transparent opacity-0 group-hover:opacity-100 hover:border-violet-400"
            : "border-slate-300 bg-white text-transparent opacity-0 group-hover:opacity-100 hover:border-violet-400"
      }`}
      title={
        selected
          ? "Deselect"
          : "Select"
      }
    >
      <Check
        size={15}
        strokeWidth={3}
      />
    </button>
  );
}

function TrashItemMenu({
  isDark,
  onRestore,
  onDelete
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      data-no-marquee="true"
    >
      <button
        type="button"
        data-no-marquee="true"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100 ${
          isDark
            ? "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
            : "text-slate-500 hover:bg-slate-100"
        }`}
        title="More actions"
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        <div
          data-no-marquee="true"
          className={`absolute right-0 top-10 z-[100] w-48 overflow-hidden rounded-2xl border py-2 shadow-2xl ${
            isDark
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onRestore();
            }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
              isDark
                ? "text-slate-200 hover:bg-slate-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <RotateCcw size={17} />
            Restore
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition ${
              isDark
                ? "hover:bg-red-500/10 hover:text-red-300"
                : "hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <Trash2 size={17} />
            Delete forever
          </button>
        </div>
      )}
    </div>
  );
}

function PermanentDeleteConfirmModal({
  items,
  deleting,
  isDark,
  onCancel,
  onConfirm
}) {
  const names = items
    .slice(0, 4)
    .map(
      (selected) =>
        selected.item?.name ||
        "Untitled item"
    );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="p-6">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isDark
                ? "bg-red-500/15 text-red-400"
                : "bg-red-50 text-red-600"
            }`}
          >
            <Trash2 size={23} />
          </div>

          <h2
            className={`mt-5 text-xl font-bold ${
              isDark
                ? "text-slate-100"
                : "text-slate-900"
            }`}
          >
            Delete selected items forever?
          </h2>

          <p
            className={`mt-2 text-sm leading-6 ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            You are about to permanently delete{" "}
            <span
              className={`font-semibold ${
                isDark
                  ? "text-slate-200"
                  : "text-slate-700"
              }`}
            >
              {items.length} item
              {items.length === 1 ? "" : "s"}
            </span>
            . This action cannot be undone.
          </p>

          <div
            className={`mt-5 max-h-36 overflow-y-auto rounded-2xl px-4 py-3 ${
              isDark
                ? "bg-slate-800"
                : "bg-slate-50"
            }`}
          >
            {names.map((name, index) => (
              <div
                key={`${name}-${index}`}
                className={`truncate py-1 text-sm font-medium ${
                  isDark
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                • {name}
              </div>
            ))}

            {items.length > 4 && (
              <div
                className={`pt-1 text-sm font-semibold ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                + {items.length - 4} more
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex justify-end gap-3 border-t px-6 py-4 ${
            isDark
              ? "border-slate-800"
              : "border-slate-100"
          }`}
        >
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? (
              <>
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete forever
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  const value = Number(bytes) || 0;

  if (value <= 0) return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
  ];

  const index = Math.min(
    Math.floor(
      Math.log(value) /
        Math.log(1024)
    ),
    units.length - 1
  );

  const size =
    value /
    Math.pow(1024, index);

  return `${size.toFixed(
    index === 0
      ? 0
      : size < 10
        ? 2
        : 1
  )} ${units[index]}`;
}

export default TrashPage;
