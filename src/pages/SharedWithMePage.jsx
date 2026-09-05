import * as LucideIcons from "lucide-react";

const {
  ArrowLeft,
  Check,
  Download,
  Link2,
  MoreVertical,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X
} = LucideIcons;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import DriveToolbar from "../components/DriveToolbar";
import DriveDropOverlay from "../components/DriveDropOverlay";
import useDriveDragDrop, { extractExternalFiles } from "../hooks/useDriveDragDrop";
import { hasDriveDragPayload, hasExternalFiles, readDriveDragPayload, writeDriveDragPayload } from "../utils/driveDragData";
import { getItemDisplayName, getItemTypeConfig, getItemTypeKey } from "../utils/fileTypeConfig";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "folder", label: "Folders" },
  { value: "document", label: "Documents" },
  { value: "spreadsheet", label: "Spreadsheets" },
  { value: "presentation", label: "Presentations" },
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
  { value: "other", label: "Other" },
];

function formatFileSize(bytes) {
  const value = Number(bytes || 0);

  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  const size = value / Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : size < 10 ? 2 : 1
  )} ${units[index]}`;
}

function SharedWithMePage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [viewMode, setViewMode] = useState(
    () =>
      localStorage.getItem("sharedViewMode") ||
      settings?.defaultView ||
      "grid"
  );

  const [selectedItems, setSelectedItems] = useState([]);
  const [dragSelection, setDragSelection] = useState(null);

  const selectionAreaRef = useRef(null);
  const dragBaseRef = useRef([]);
  const deepLinkHandledRef = useRef(false);
  const [folderDropTargetId, setFolderDropTargetId] = useState(null);
  const [dropBusy, setDropBusy] = useState(false);

  const [showGemini, setShowGemini] = useState(false);
  const [geminiQuestion, setGeminiQuestion] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [geminiError, setGeminiError] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = (event) => {
      setSystemDark(event.matches);
    };

    mediaQuery.addEventListener?.(
      "change",
      handleChange
    );

    return () => {
      mediaQuery.removeEventListener?.(
        "change",
        handleChange
      );
    };
  }, []);

  const isDark =
    settings?.theme === "dark" ||
    (
      settings?.theme === "system" &&
      systemDark
    );

  const fetchSharedItems = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          "/shares/shared-with-me"
        );

        setItems(
          response.data?.items || []
        );
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "Unable to load shared items."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSharedItems();
  }, [fetchSharedItems]);

  const normalizedItems = useMemo(
    () =>
      items
        .filter((sharedItem) => sharedItem?.item?.id)
        .map((sharedItem) => ({
          ...sharedItem,
          key: `${sharedItem.resourceType}:${sharedItem.item.id}`,
        })),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return normalizedItems.filter(
      (sharedItem) => {
        const item = sharedItem.item;

        const name =
          sharedItem.resourceType === "file"
            ? getItemDisplayName(item)
            : item.name;

        const matchesSearch =
          !query ||
          String(name || "")
            .toLowerCase()
            .includes(query);

        if (!matchesSearch) {
          return false;
        }

        if (typeFilter === "all") {
          return true;
        }

        if (typeFilter === "folder") {
          return (
            sharedItem.resourceType ===
            "folder"
          );
        }

        return (
          sharedItem.resourceType ===
            "file" &&
          getItemTypeKey(item, "file") ===
            typeFilter
        );
      }
    );
  }, [
    normalizedItems,
    searchQuery,
    typeFilter,
  ]);

  const folders = filteredItems.filter(
    (item) =>
      item.resourceType === "folder"
  );

  const files = filteredItems.filter(
    (item) =>
      item.resourceType === "file"
  );

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const isSelected = (sharedItem) =>
    selectedItems.some(
      (selected) =>
        selected.key === sharedItem.key
    );

  const toggleSelection = (sharedItem) => {
    setSelectedItems((current) => {
      const exists = current.some(
        (selected) =>
          selected.key === sharedItem.key
      );

      if (exists) {
        return current.filter(
          (selected) =>
            selected.key !== sharedItem.key
        );
      }

      return [
        ...current,
        sharedItem,
      ];
    });
  };

  const openRegularFile = useCallback(
    async (file) => {
      try {
        setError("");

        const response = await api.get(
          `/files/${file.id}`
        );

        const url =
          response.data?.signedUrl ||
          response.data?.downloadUrl ||
          response.data?.url ||
          response.data?.file?.signedUrl ||
          response.data?.file?.downloadUrl ||
          response.data?.file?.url;

        if (!url) {
          throw new Error(
            "File URL was not returned."
          );
        }

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            "Unable to open this shared file."
        );
      }
    },
    []
  );

  const handleOpenFile = useCallback(
    async (file) => {
      const type =
        getItemTypeKey(file, "file");

      if (type === "document") {
        navigate(
          `/documents/${file.id}`,
          {
            state: {
              returnTo: "/shared",
            },
          }
        );
        return;
      }

      if (type === "spreadsheet") {
        navigate(
          `/spreadsheets/${file.id}`,
          {
            state: {
              returnTo: "/shared",
            },
          }
        );
        return;
      }

      if (type === "presentation") {
        navigate(
          `/presentations/${file.id}`,
          {
            state: {
              returnTo: "/shared",
            },
          }
        );
        return;
      }

      await openRegularFile(file);
    },
    [navigate, openRegularFile]
  );

  useEffect(() => {
    if (
      loading ||
      deepLinkHandledRef.current
    ) {
      return;
    }

    const fileId =
      searchParams.get("fileId");

    if (!fileId) {
      return;
    }

    deepLinkHandledRef.current = true;

    const sharedFile =
      normalizedItems.find(
        (sharedItem) =>
          sharedItem.resourceType ===
            "file" &&
          String(
            sharedItem.item?.id
          ) === String(fileId)
      );

    if (!sharedFile) {
      setError(
        "This shared file could not be found, or you no longer have access."
      );
      return;
    }

    const next =
      new URLSearchParams(
        searchParams
      );

    next.delete("fileId");

    setSearchParams(
      next,
      {
        replace: true,
      }
    );

    handleOpenFile(
      sharedFile.item
    );
  }, [
    loading,
    normalizedItems,
    searchParams,
    setSearchParams,
    handleOpenFile,
  ]);

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    if (
      event.target.closest(
        "button,input,textarea,select,a,[data-no-marquee='true'],[draggable='true']"
      )
    ) {
      return;
    }

    const container =
      selectionAreaRef.current;

    if (!container) {
      return;
    }

    const rect =
      container.getBoundingClientRect();

    const startX =
      event.clientX - rect.left;

    const startY =
      event.clientY - rect.top;

    dragBaseRef.current =
      event.ctrlKey ||
      event.metaKey
        ? [...selectedItems]
        : [];

    if (
      !event.ctrlKey &&
      !event.metaKey
    ) {
      setSelectedItems([]);
    }

    setDragSelection({
      pointerId:
        event.pointerId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      moved: false,
    });

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      );
    } catch {
      // Pointer capture is optional.
    }
  };

  const handlePointerMove = (event) => {
    if (!dragSelection) {
      return;
    }

    const container =
      selectionAreaRef.current;

    if (!container) {
      return;
    }

    const rect =
      container.getBoundingClientRect();

    const currentX =
      event.clientX - rect.left;

    const currentY =
      event.clientY - rect.top;

    const moved =
      dragSelection.moved ||
      Math.abs(
        currentX -
          dragSelection.startX
      ) > 4 ||
      Math.abs(
        currentY -
          dragSelection.startY
      ) > 4;

    const next = {
      ...dragSelection,
      currentX,
      currentY,
      moved,
    };

    setDragSelection(next);

    if (!moved) {
      return;
    }

    const left =
      Math.min(
        next.startX,
        currentX
      ) + rect.left;

    const right =
      Math.max(
        next.startX,
        currentX
      ) + rect.left;

    const top =
      Math.min(
        next.startY,
        currentY
      ) + rect.top;

    const bottom =
      Math.max(
        next.startY,
        currentY
      ) + rect.top;

    const merged =
      new Map(
        dragBaseRef.current.map(
          (item) => [
            item.key,
            item,
          ]
        )
      );

    container
      .querySelectorAll(
        "[data-shared-key]"
      )
      .forEach((node) => {
        const itemRect =
          node.getBoundingClientRect();

        const intersects =
          itemRect.right >=
            left &&
          itemRect.left <=
            right &&
          itemRect.bottom >=
            top &&
          itemRect.top <=
            bottom;

        if (!intersects) {
          return;
        }

        const key =
          node.getAttribute(
            "data-shared-key"
          );

        const item =
          filteredItems.find(
            (candidate) =>
              candidate.key === key
          );

        if (item) {
          merged.set(
            item.key,
            item
          );
        }
      });

    setSelectedItems(
      Array.from(
        merged.values()
      )
    );
  };

  const handlePointerUp = (event) => {
    if (!dragSelection) {
      return;
    }

    try {
      event.currentTarget.releasePointerCapture(
        dragSelection.pointerId
      );
    } catch {
      // Pointer capture is optional.
    }

    setDragSelection(null);
  };



  const uploadDroppedEntriesToMyDrive = async (entries) => {
    if (!entries?.length) return;

    try {
      setDropBusy(true);
      setError("");
      setMessage("");

      const folderStructure = entries.some((entry) =>
        String(entry.relativePath || "").includes("/")
      );

      if (folderStructure) {
        const formData = new FormData();
        const relativePaths = [];

        entries.forEach((entry) => {
          if (!entry?.file) return;
          formData.append("files", entry.file);
          relativePaths.push(
            entry.relativePath || entry.file.name
          );
        });

        formData.append(
          "relativePaths",
          JSON.stringify(relativePaths)
        );

        await api.post(
          "/files/upload-folder",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
      } else {
        const results = await Promise.allSettled(
          entries.map((entry) => {
            const formData = new FormData();
            formData.append("file", entry.file);

            return api.post(
              "/files/upload",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data"
                }
              }
            );
          })
        );

        const failed = results.find(
          (result) => result.status === "rejected"
        );

        if (failed) {
          throw failed.reason;
        }
      }

      setMessage(
        "Dropped items uploaded to My Drive."
      );

      window.dispatchEvent(
        new Event("cloud-drive-storage-changed")
      );
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to upload dropped items."
      );
    } finally {
      setDropBusy(false);
    }
  };

  const moveDroppedItemsToMyDrive = async (itemsToMove) => {
    if (!itemsToMove?.length) return;

    try {
      setDropBusy(true);
      setError("");
      setMessage("");

      const results = await Promise.allSettled(
        itemsToMove.map((entry) =>
          entry.resourceType === "folder"
            ? api.patch(
                `/folders/${entry.id}`,
                { parentId: null }
              )
            : api.patch(
                `/files/${entry.id}`,
                { folderId: null }
              )
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      const movedCount =
        results.length - failed.length;

      if (movedCount > 0) {
        setMessage(
          `${movedCount} item${
            movedCount === 1 ? "" : "s"
          } moved to My Drive.`
        );
      }

      if (failed.length > 0) {
        const reason = failed[0].reason;

        setError(
          reason?.response?.data?.error?.message ||
            reason?.response?.data?.message ||
            "Some shared items could not be moved. Viewer access cannot move the owner's items."
        );
      }

      clearSelection();
      await fetchSharedItems(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to move dropped items."
      );
    } finally {
      setDropBusy(false);
    }
  };

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop
  } = useDriveDragDrop({
    disabled: loading,
    onExternalDrop: uploadDroppedEntriesToMyDrive,
    onInternalDrop: moveDroppedItemsToMyDrive
  });

  const canEditSharedItem = (sharedItem) =>
    ["editor", "owner"].includes(
      String(sharedItem?.permission || "").toLowerCase()
    );

  const uploadToSharedFolder = async (entries, destinationFolderId) => {
    if (!entries?.length) return;
    try {
      setDropBusy(true);
      setError("");
      setMessage("");

      const folderStructure = entries.some((entry) =>
        String(entry.relativePath || "").includes("/")
      );

      if (folderStructure) {
        const formData = new FormData();
        const relativePaths = [];
        entries.forEach((entry) => {
          if (!entry?.file) return;
          formData.append("files", entry.file);
          relativePaths.push(entry.relativePath || entry.file.name);
        });
        formData.append("relativePaths", JSON.stringify(relativePaths));
        formData.append("parentFolderId", destinationFolderId);
        await api.post("/files/upload-folder", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        const results = await Promise.allSettled(
          entries.map((entry) => {
            const formData = new FormData();
            formData.append("file", entry.file);
            formData.append("folderId", destinationFolderId);
            return api.post("/files/upload", formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          })
        );
        const failed = results.find((result) => result.status === "rejected");
        if (failed) throw failed.reason;
      }

      setMessage("Dropped items uploaded to the shared folder.");
      window.dispatchEvent(new Event("cloud-drive-storage-changed"));
      await fetchSharedItems(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "You do not have permission to upload to this shared folder."
      );
    } finally {
      setDropBusy(false);
      setFolderDropTargetId(null);
    }
  };

  const moveToSharedFolder = async (itemsToMove, destinationFolderId) => {
    const valid = (itemsToMove || []).filter(
      (entry) =>
        !(entry.resourceType === "folder" &&
          String(entry.id) === String(destinationFolderId))
    );
    if (!valid.length) {
      setError("A folder cannot be moved into itself.");
      return;
    }

    try {
      setDropBusy(true);
      setError("");
      const results = await Promise.allSettled(
        valid.map((entry) =>
          entry.resourceType === "folder"
            ? api.patch(`/folders/${entry.id}`, { parentId: destinationFolderId })
            : api.patch(`/files/${entry.id}`, { folderId: destinationFolderId })
        )
      );
      const failed = results.find((result) => result.status === "rejected");
      if (failed) throw failed.reason;
      setMessage(`${valid.length} item${valid.length === 1 ? "" : "s"} moved into the shared folder.`);
      clearSelection();
      await fetchSharedItems(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "You do not have permission to move items into this shared folder."
      );
    } finally {
      setDropBusy(false);
      setFolderDropTargetId(null);
    }
  };

  const handleSharedDragStart = (sharedItem, event) => {
    const records =
      isSelected(sharedItem) && selectedItems.length
        ? selectedItems
        : [sharedItem];

    if (!isSelected(sharedItem)) setSelectedItems([sharedItem]);

    writeDriveDragPayload(
      event.dataTransfer,
      records.map((entry) => ({
        resourceType: entry.resourceType,
        item: entry.item
      }))
    );
  };

  const handleSharedFolderDragOver = (sharedItem, event) => {
    if (!canEditSharedItem(sharedItem)) return;
    const external = hasExternalFiles(event.dataTransfer);
    const internal = hasDriveDragPayload(event.dataTransfer);
    if (!external && !internal) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = internal ? "move" : "copy";
    setFolderDropTargetId(String(sharedItem.item.id));
  };

  const handleSharedFolderDrop = async (sharedItem, event) => {
    if (!canEditSharedItem(sharedItem)) return;
    const internal = readDriveDragPayload(event.dataTransfer);
    const external = hasExternalFiles(event.dataTransfer);
    if (!internal && !external) return;
    event.preventDefault();
    event.stopPropagation();
    setFolderDropTargetId(null);

    if (internal) {
      await moveToSharedFolder(internal.items, sharedItem.item.id);
      return;
    }

    const entries = await extractExternalFiles(event.dataTransfer);
    await uploadToSharedFolder(entries, sharedItem.item.id);
  };

  const handleCopyLinks = async () => {
    if (!selectedItems.length) {
      return;
    }

    try {
      const links =
        selectedItems.map(
          (selected) => {
            if (
              selected.resourceType ===
              "folder"
            ) {
              return `${window.location.origin}/shared/folder/${selected.item.id}`;
            }

            const type =
              getItemTypeKey(
                selected.item,
                "file"
              );

            if (
              type === "document"
            ) {
              return `${window.location.origin}/documents/${selected.item.id}`;
            }

            if (
              type === "spreadsheet"
            ) {
              return `${window.location.origin}/spreadsheets/${selected.item.id}`;
            }

            if (
              type === "presentation"
            ) {
              return `${window.location.origin}/presentations/${selected.item.id}`;
            }

            return `${window.location.origin}/shared?fileId=${selected.item.id}`;
          }
        );

      await navigator.clipboard.writeText(
        links.join("\n")
      );

      setMessage(
        selectedItems.length === 1
          ? "Link copied."
          : `${selectedItems.length} links copied.`
      );
    } catch {
      setError(
        "Unable to copy the selected links."
      );
    }
  };

  const handleDownloadSelected = async () => {
    const selectedFiles =
      selectedItems.filter(
        (item) =>
          item.resourceType === "file"
      );

    if (!selectedFiles.length) {
      setError(
        "Select at least one file to download."
      );
      return;
    }

    let downloaded = 0;

    for (const selected of selectedFiles) {
      const type =
        getItemTypeKey(
          selected.item,
          "file"
        );

      if (
        [
          "document",
          "spreadsheet",
          "presentation",
        ].includes(type)
      ) {
        continue;
      }

      try {
        const response =
          await api.get(
            `/files/${selected.item.id}`
          );

        const url =
          response.data?.signedUrl ||
          response.data?.downloadUrl ||
          response.data?.url ||
          response.data?.file?.signedUrl ||
          response.data?.file?.downloadUrl ||
          response.data?.file?.url;

        if (url) {
          window.open(
            url,
            "_blank",
            "noopener,noreferrer"
          );
          downloaded += 1;
        }
      } catch {
        // Continue downloading the remaining files.
      }
    }

    if (downloaded > 0) {
      setMessage(
        `${downloaded} file${
          downloaded === 1 ? "" : "s"
        } opened for download.`
      );
    }
  };

  const handleToggleStar = async () => {
    if (!selectedItems.length) {
      return;
    }

    try {
      setError("");

      const results =
        await Promise.allSettled(
          selectedItems.map(
            (selected) =>
              api.patch(
                selected.resourceType ===
                  "folder"
                  ? `/starred/folders/${selected.item.id}`
                  : `/starred/files/${selected.item.id}`
              )
          )
        );

      const failed =
        results.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      setMessage(
        failed.length === 0
          ? "Starred status updated."
          : `Updated ${
              results.length -
              failed.length
            } item(s); ${
              failed.length
            } failed.`
      );

      clearSelection();

      await fetchSharedItems(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to update Starred status."
      );
    }
  };

  const handleTrashSelected = async () => {
    if (!selectedItems.length) {
      return;
    }

    const confirmed =
      window.confirm(
        `Move ${
          selectedItems.length
        } selected item${
          selectedItems.length === 1
            ? ""
            : "s"
        } to Trash?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const results =
        await Promise.allSettled(
          selectedItems.map(
            (selected) => {
              if (
                selected.resourceType ===
                "folder"
              ) {
                return api.delete(
                  `/folders/${selected.item.id}`
                );
              }

              return api.delete(
                `/files/${selected.item.id}`
              );
            }
          )
        );

      const failed =
        results.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      const deleted =
        results.length -
        failed.length;

      if (deleted > 0) {
        setMessage(
          `${deleted} item${
            deleted === 1 ? "" : "s"
          } moved to Trash.`
        );
      }

      if (failed.length > 0) {
        const firstError =
          failed[0]?.reason
            ?.response?.data
            ?.error?.message ||
          failed[0]?.reason
            ?.response?.data
            ?.message;

        setError(
          firstError ||
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be moved to Trash.`
        );
      }

      clearSelection();

      await fetchSharedItems(true);

      window.dispatchEvent(
        new Event(
          "cloud-drive-storage-changed"
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to move selected items to Trash."
      );
    }
  };

  const handleAskGemini = async () => {
    const question =
      geminiQuestion.trim();

    if (
      !question ||
      !selectedItems.length
    ) {
      return;
    }

    try {
      setGeminiLoading(true);
      setGeminiError("");
      setGeminiResponse("");

      const response =
        await api.post(
          "/gemini/ask",
          {
            question,
            items:
              selectedItems.map(
                (selected) => ({
                  id:
                    selected.item.id,
                  resourceType:
                    selected.resourceType,
                })
              ),
          }
        );

      setGeminiResponse(
        response.data?.answer ||
          "No answer returned."
      );
    } catch (err) {
      setGeminiError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to get a Gemini response."
      );
    } finally {
      setGeminiLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDark
            ? "bg-slate-950"
            : "bg-[#F6F8FC]"
        }`}
      >
        <RefreshCw
          size={32}
          className="animate-spin text-violet-500"
        />
      </div>
    );
  }

  return (
    <div
      {...dropZoneProps}
      className={`relative min-h-screen px-6 py-8 lg:px-12 lg:py-10 ${
        isDark
          ? "bg-slate-950"
          : "bg-[#F6F8FC]"
      }`}
    >
      <DriveDropOverlay
        isDark={isDark}
        visible={
          !folderDropTargetId &&
          (
            isExternalDragActive ||
            isInternalDragActive
          )
        }
        processing={
          isProcessingDrop || dropBusy
        }
        mode={
          isInternalDragActive
            ? "move"
            : "upload"
        }
        title={
          isInternalDragActive
            ? "Move to My Drive"
            : "Upload to My Drive"
        }
        description="Shared with me is a view. Drop on an editable shared folder to place items there, or drop on blank space to use My Drive root."
      />

      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className={`mt-2 flex h-10 w-10 items-center justify-center rounded-xl ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800"
                  : "text-slate-500 hover:bg-white"
              }`}
            >
              <ArrowLeft
                size={23}
              />
            </button>

            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-violet-500/15 text-violet-400"
                  : "bg-violet-50 text-violet-600"
              }`}
            >
              <Users size={30} />
            </div>

            <div>
              <h1
                className={`text-4xl font-bold ${
                  isDark
                    ? "text-slate-100"
                    : "text-slate-950"
                }`}
              >
                Shared with me
              </h1>

              <p
                className={`mt-2 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Files and folders other people have shared with you.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchSharedItems(true)
            }
            disabled={refreshing}
            className={`flex h-11 items-center gap-2 rounded-xl border px-4 font-semibold ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="mt-8">
          <DriveToolbar
            searchQuery={
              searchQuery
            }
            onSearchChange={(value) => {
              setSearchQuery(value);
              clearSelection();
            }}
            searchPlaceholder="Search shared items..."
            typeFilter={
              typeFilter
            }
            onTypeFilterChange={(value) => {
              setTypeFilter(value);
              clearSelection();
            }}
            typeOptions={
              TYPE_OPTIONS
            }
            viewMode={
              viewMode
            }
            onViewModeChange={(mode) => {
              setViewMode(mode);

              localStorage.setItem(
                "sharedViewMode",
                mode
              );
            }}
            isDark={isDark}
          />
        </div>

        {selectedItems.length > 0 && (
          <SelectionToolbar
            count={
              selectedItems.length
            }
            isDark={isDark}
            onClear={
              clearSelection
            }
            onGemini={() =>
              setShowGemini(true)
            }
            onDownload={
              handleDownloadSelected
            }
            onCopyLink={
              handleCopyLinks
            }
            onStar={
              handleToggleStar
            }
            onTrash={
              handleTrashSelected
            }
          />
        )}

        {message && (
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${
              isDark
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${
              isDark
                ? "border-red-500/20 bg-red-500/10 text-red-300"
                : "border-red-100 bg-red-50 text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        {!error &&
        filteredItems.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center text-center">
            <div>
              <Share2
                size={44}
                className="mx-auto text-violet-400"
              />

              <h2
                className={`mt-5 text-xl font-bold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-800"
                }`}
              >
                No shared items found
              </h2>
            </div>
          </div>
        ) : (
          <div
            ref={
              selectionAreaRef
            }
            onPointerDown={
              handlePointerDown
            }
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={
              handlePointerUp
            }
            onPointerCancel={
              handlePointerUp
            }
            className="relative mt-10 select-none"
          >
            {dragSelection?.moved && (
              <div
                className={`pointer-events-none absolute z-[70] border ${
                  isDark
                    ? "border-violet-400 bg-violet-400/15"
                    : "border-violet-500 bg-violet-300/25"
                }`}
                style={{
                  left:
                    Math.min(
                      dragSelection.startX,
                      dragSelection.currentX
                    ),
                  top:
                    Math.min(
                      dragSelection.startY,
                      dragSelection.currentY
                    ),
                  width:
                    Math.abs(
                      dragSelection.currentX -
                        dragSelection.startX
                    ),
                  height:
                    Math.abs(
                      dragSelection.currentY -
                        dragSelection.startY
                    ),
                }}
              />
            )}

            {folders.length > 0 && (
              <SharedSection
                title="FOLDERS"
                items={folders}
                viewMode={
                  viewMode
                }
                isDark={isDark}
                isSelected={
                  isSelected
                }
                onSelect={
                  toggleSelection
                }
                onOpen={(sharedItem) => {
                  clearSelection();
                  navigate(`/shared/folder/${sharedItem.item.id}`, {
                    state: { from: "/shared", sharedRootId: sharedItem.item.id }
                  });
                }}
                onDragStart={handleSharedDragStart}
                folderDropTargetId={folderDropTargetId}
                dropBusy={dropBusy}
                canEditSharedItem={canEditSharedItem}
                onFolderDragOver={handleSharedFolderDragOver}
                onFolderDrop={handleSharedFolderDrop}
              />
            )}

            {files.length > 0 && (
              <SharedSection
                title="FILES"
                items={files}
                viewMode={
                  viewMode
                }
                isDark={isDark}
                isSelected={
                  isSelected
                }
                onSelect={
                  toggleSelection
                }
                onOpen={(sharedItem) => handleOpenFile(sharedItem.item)}
                onDragStart={handleSharedDragStart}
                folderDropTargetId={folderDropTargetId}
                dropBusy={dropBusy}
                canEditSharedItem={canEditSharedItem}
                onFolderDragOver={handleSharedFolderDragOver}
                onFolderDrop={handleSharedFolderDrop}
              />
            )}
          </div>
        )}
      </div>

      {showGemini && (
        <GeminiModal
          isDark={isDark}
          question={
            geminiQuestion
          }
          setQuestion={
            setGeminiQuestion
          }
          response={
            geminiResponse
          }
          error={geminiError}
          loading={
            geminiLoading
          }
          onAsk={
            handleAskGemini
          }
          onClose={() => {
            if (geminiLoading) {
              return;
            }

            setShowGemini(false);
            setGeminiQuestion("");
            setGeminiResponse("");
            setGeminiError("");
          }}
        />
      )}
    </div>
  );
}

function SelectionToolbar({
  count,
  isDark,
  onClear,
  onGemini,
  onDownload,
  onCopyLink,
  onStar,
  onTrash,
}) {
  const [
    moreOpen,
    setMoreOpen,
  ] = useState(false);

  return (
    <div
      className={`relative mt-5 flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border px-4 ${
        isDark
          ? "border-violet-500/30 bg-slate-800 text-slate-200"
          : "border-violet-200 bg-violet-50 text-slate-700"
      }`}
    >
      <ActionButton
        title="Clear selection"
        isDark={isDark}
        onClick={() => {
          setMoreOpen(false);
          onClear();
        }}
      >
        <X size={22} />
      </ActionButton>

      <span className="min-w-[105px] text-[15px] font-semibold">
        {count} selected
      </span>

      <div
        className={`mx-1 h-7 w-px ${
          isDark
            ? "bg-slate-600"
            : "bg-violet-200"
        }`}
      />

      <button
        type="button"
        onClick={onGemini}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
          isDark
            ? "border-violet-500/30 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25"
            : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
        }`}
      >
        <Sparkles size={16} />
        Ask Gemini
      </button>

      <ActionButton
        title="Download selected files"
        isDark={isDark}
        onClick={onDownload}
      >
        <Download size={20} />
      </ActionButton>

      <ActionButton
        title="Copy link"
        isDark={isDark}
        onClick={onCopyLink}
      >
        <Link2 size={20} />
      </ActionButton>

      <ActionButton
        title="Star / unstar"
        isDark={isDark}
        onClick={onStar}
      >
        <Star size={20} />
      </ActionButton>

      <ActionButton
        title="Move to Trash"
        isDark={isDark}
        danger
        onClick={onTrash}
      >
        <Trash2 size={20} />
      </ActionButton>

      <div className="relative">
        <ActionButton
          title="More actions"
          isDark={isDark}
          onClick={() =>
            setMoreOpen(
              (current) =>
                !current
            )
          }
        >
          <MoreVertical
            size={20}
          />
        </ActionButton>

        {moreOpen && (
          <div
            className={`absolute right-0 top-12 z-[100] w-56 overflow-hidden rounded-2xl border py-2 shadow-2xl ${
              isDark
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-white"
            }`}
          >
            <MenuButton
              isDark={isDark}
              icon={
                <Star size={17} />
              }
              label="Star / unstar"
              onClick={() => {
                setMoreOpen(false);
                onStar();
              }}
            />

            <MenuButton
              isDark={isDark}
              icon={
                <Link2 size={17} />
              }
              label="Copy link"
              onClick={() => {
                setMoreOpen(false);
                onCopyLink();
              }}
            />

            <MenuButton
              isDark={isDark}
              icon={
                <Download
                  size={17}
                />
              }
              label="Download files"
              onClick={() => {
                setMoreOpen(false);
                onDownload();
              }}
            />

            <div
              className={`my-2 border-t ${
                isDark
                  ? "border-slate-700"
                  : "border-slate-100"
              }`}
            />

            <MenuButton
              isDark={isDark}
              danger
              icon={
                <Trash2
                  size={17}
                />
              }
              label="Move to Trash"
              onClick={() => {
                setMoreOpen(false);
                onTrash();
              }}
            />

            <MenuButton
              isDark={isDark}
              icon={
                <X size={17} />
              }
              label="Clear selection"
              onClick={() => {
                setMoreOpen(false);
                onClear();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  title,
  isDark,
  onClick,
  danger = false,
  children,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
        danger
          ? isDark
            ? "text-slate-300 hover:bg-red-500/15 hover:text-red-300"
            : "text-slate-600 hover:bg-red-50 hover:text-red-600"
          : isDark
            ? "text-slate-300 hover:bg-slate-700 hover:text-violet-300"
            : "text-slate-600 hover:bg-white hover:text-violet-600"
      }`}
    >
      {children}
    </button>
  );
}

function MenuButton({
  isDark,
  icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
        danger
          ? isDark
            ? "text-red-300 hover:bg-red-500/10"
            : "text-red-600 hover:bg-red-50"
          : isDark
            ? "text-slate-200 hover:bg-slate-700"
            : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SharedSection({
  title,
  items,
  viewMode,
  isDark,
  isSelected,
  onSelect,
  onOpen,
  onDragStart,
  folderDropTargetId,
  dropBusy,
  canEditSharedItem,
  onFolderDragOver,
  onFolderDrop
}) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between">
        <h2
          className={`text-xs font-bold tracking-[0.18em] ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {title}
        </h2>

        <span
          className={`rounded-full px-3 py-1 text-xs ${
            isDark
              ? "bg-slate-800 text-slate-300"
              : "bg-white text-slate-500 shadow-sm"
          }`}
        >
          {items.length}
        </span>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(
            (sharedItem) => (
              <SharedGridItem
                key={
                  sharedItem.key
                }
                sharedItem={
                  sharedItem
                }
                selected={isSelected(
                  sharedItem
                )}
                isDark={
                  isDark
                }
                onSelect={() =>
                  onSelect(
                    sharedItem
                  )
                }
                onOpen={() => onOpen(sharedItem)}
                onDragStart={onDragStart}
                canEdit={sharedItem.resourceType === "folder" && canEditSharedItem(sharedItem)}
                dropTarget={sharedItem.resourceType === "folder" && String(folderDropTargetId) === String(sharedItem.item.id)}
                dropBusy={dropBusy}
                onFolderDragOver={onFolderDragOver}
                onFolderDrop={onFolderDrop}
              />
            )
          )}
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-2xl border ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          {items.map(
            (sharedItem) => (
              <SharedListItem
                key={
                  sharedItem.key
                }
                sharedItem={
                  sharedItem
                }
                selected={isSelected(
                  sharedItem
                )}
                isDark={
                  isDark
                }
                onSelect={() =>
                  onSelect(
                    sharedItem
                  )
                }
                onOpen={() => onOpen(sharedItem)}
                onDragStart={onDragStart}
                canEdit={sharedItem.resourceType === "folder" && canEditSharedItem(sharedItem)}
                dropTarget={sharedItem.resourceType === "folder" && String(folderDropTargetId) === String(sharedItem.item.id)}
                dropBusy={dropBusy}
                onFolderDragOver={onFolderDragOver}
                onFolderDrop={onFolderDrop}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function SharedGridItem({
  sharedItem,
  selected,
  isDark,
  onSelect,
  onOpen,
  onDragStart,
  canEdit,
  dropTarget,
  dropBusy,
  onFolderDragOver,
  onFolderDrop
}) {
  const item =
    sharedItem.item;

  const resourceType =
    sharedItem.resourceType;

  const config =
    getItemTypeConfig(
      item,
      resourceType
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon =
    config.icon;

  const name =
    resourceType === "file"
      ? getItemDisplayName(item)
      : item.name;

  return (
    <div
      data-shared-key={sharedItem.key}
      draggable
      onDragStart={(event) => onDragStart(sharedItem, event)}
      onDragOver={(event) => {
        if (sharedItem.resourceType === "folder") onFolderDragOver(sharedItem, event);
      }}
      onDrop={(event) => {
        if (sharedItem.resourceType === "folder") onFolderDrop(sharedItem, event);
      }}
      title={sharedItem.resourceType === "folder" && !canEdit ? "Viewer access — open only" : undefined}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition ${
        dropTarget
          ? isDark
            ? "border-violet-300 bg-violet-500/20 ring-4 ring-violet-500/30"
            : "border-violet-500 bg-violet-100 ring-4 ring-violet-200"
          : selected
          ? isDark
            ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25"
            : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
          : isDark
            ? `bg-slate-900 ${colors.border}`
            : `bg-white ${colors.border}`
      }`}
    >
      <div className="absolute left-3 top-3 z-20">
        <SelectionCheckbox
          selected={selected}
          isDark={isDark}
          onClick={onSelect}
        />
      </div>

      <button
        type="button"
        data-no-marquee="true"
        onClick={onOpen}
        className="w-full text-left"
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors.iconBox}`}
        >
          <Icon size={30} />
        </div>

        <p
          className={`mt-4 truncate font-bold ${
            isDark
              ? "text-slate-100"
              : "text-slate-800"
          }`}
        >
          {name}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${colors.badge}`}
          >
            {config.label}
          </span>

          <PermissionBadge
            permission={
              sharedItem.permission
            }
            isDark={isDark}
          />
        </div>

        {resourceType === "file" && (
          <p
            className={`mt-3 text-xs ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            {formatFileSize(
              item.sizeBytes
            )}
          </p>
        )}
      </button>
    </div>
  );
}

function SharedListItem({
  sharedItem,
  selected,
  isDark,
  onSelect,
  onOpen,
  onDragStart,
  canEdit,
  dropTarget,
  dropBusy,
  onFolderDragOver,
  onFolderDrop
}) {
  const item =
    sharedItem.item;

  const resourceType =
    sharedItem.resourceType;

  const config =
    getItemTypeConfig(
      item,
      resourceType
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon =
    config.icon;

  const name =
    resourceType === "file"
      ? getItemDisplayName(item)
      : item.name;

  return (
    <div
      data-shared-key={sharedItem.key}
      draggable
      onDragStart={(event) => onDragStart(sharedItem, event)}
      onDragOver={(event) => {
        if (sharedItem.resourceType === "folder") onFolderDragOver(sharedItem, event);
      }}
      onDrop={(event) => {
        if (sharedItem.resourceType === "folder") onFolderDrop(sharedItem, event);
      }}
      title={sharedItem.resourceType === "folder" && !canEdit ? "Viewer access — open only" : undefined}
      className={`group grid min-h-[72px] grid-cols-[40px_minmax(0,1fr)_140px_120px] items-center gap-4 border-b px-5 last:border-b-0 ${
        dropTarget
          ? isDark
            ? "border-violet-400 bg-violet-500/20"
            : "border-violet-300 bg-violet-100"
          : selected
          ? isDark
            ? "border-violet-500/30 bg-violet-500/15"
            : "border-violet-200 bg-violet-50"
          : isDark
            ? "border-slate-800 hover:bg-slate-800/70"
            : "border-slate-100 hover:bg-slate-50"
      }`}
    >
      <SelectionCheckbox
        selected={selected}
        isDark={isDark}
        onClick={onSelect}
      />

      <button
        type="button"
        data-no-marquee="true"
        onClick={onOpen}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon size={21} />
        </div>

        <span
          className={`truncate font-semibold ${
            isDark
              ? "text-slate-100"
              : "text-slate-800"
          }`}
        >
          {name}
        </span>
      </button>

      <span
        className={
          isDark
            ? "text-sm text-slate-400"
            : "text-sm text-slate-500"
        }
      >
        {config.label}
      </span>

      <PermissionBadge
        permission={
          sharedItem.permission
        }
        isDark={isDark}
      />
    </div>
  );
}

function SelectionCheckbox({
  selected,
  isDark,
  onClick,
}) {
  return (
    <button
      type="button"
      data-no-marquee="true"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
        selected
          ? "border-violet-500 bg-violet-500 text-white opacity-100"
          : isDark
            ? "border-slate-600 bg-slate-800 text-transparent opacity-0 group-hover:opacity-100"
            : "border-slate-300 bg-white text-transparent opacity-0 group-hover:opacity-100"
      }`}
    >
      <Check
        size={15}
        strokeWidth={3}
      />
    </button>
  );
}

function PermissionBadge({
  permission,
  isDark,
}) {
  const value =
    String(
      permission || "viewer"
    ).toLowerCase();

  return (
    <span
      className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
        value === "editor"
          ? isDark
            ? "bg-violet-500/15 text-violet-300"
            : "bg-violet-50 text-violet-600"
          : value === "owner"
            ? isDark
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-emerald-50 text-emerald-700"
            : isDark
              ? "bg-sky-500/15 text-sky-300"
              : "bg-sky-50 text-sky-700"
      }`}
    >
      {value}
    </span>
  );
}

function GeminiModal({
  isDark,
  question,
  setQuestion,
  response,
  error,
  loading,
  onAsk,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2
            className={`text-xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Ask Gemini
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          rows={4}
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          placeholder="Ask something about the selected shared items..."
          className={`mt-5 w-full rounded-2xl border p-4 outline-none ${
            isDark
              ? "border-slate-700 bg-slate-950 text-white"
              : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onAsk}
            disabled={
              loading ||
              !question.trim()
            }
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw
                size={16}
                className="animate-spin"
              />
            ) : (
              <Sparkles
                size={16}
              />
            )}

            {loading
              ? "Thinking..."
              : "Ask Gemini"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {response && (
          <div
            className={`mt-4 whitespace-pre-wrap rounded-xl p-4 text-sm leading-7 ${
              isDark
                ? "bg-violet-500/10 text-slate-200"
                : "bg-violet-50 text-slate-700"
            }`}
          >
            {response}
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedWithMePage;