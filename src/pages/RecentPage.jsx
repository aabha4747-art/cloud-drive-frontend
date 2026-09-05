import {
  Check,
  Clock3,
  Download,
  Link2,
  Loader2,
  MoreVertical,
  Move,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  ArrowLeft,
  ChevronRight,
  FolderOpen
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useOutletContext
} from "react-router-dom";

import api from "../api/axios";
import DriveToolbar from "../components/DriveToolbar";
import DriveDropOverlay from "../components/DriveDropOverlay";

import useDriveDragDrop from "../hooks/useDriveDragDrop";

import {
  writeDriveDragPayload
} from "../utils/driveDragData";

import {
  getItemDisplayName,
  getItemTypeConfig,
  getItemTypeKey
} from "../utils/fileTypeConfig";

// ======================================================
// FILTER OPTIONS
// ======================================================

const FILE_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
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
  { value: "other", label: "Other files" },
];

// ======================================================
// RECENT PAGE
// ======================================================

function RecentPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ======================================================
  // TOOLBAR
  // ======================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [viewMode, setViewMode] = useState(() => {
    return (
      localStorage.getItem("recentViewMode") ||
      settings?.defaultView ||
      "grid"
    );
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);

    localStorage.setItem(
      "recentViewMode",
      mode
    );
  };

  // ======================================================
  // DARK MODE
  // ======================================================

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

  // ======================================================
  // SELECTION
  // ======================================================

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragSelection, setDragSelection] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const selectionAreaRef = useRef(null);
  const dragBaseSelectionRef = useRef([]);

  // ======================================================
  // DRAG / DROP
  // ======================================================

  const [dragMoveCount, setDragMoveCount] = useState(0);
  const [dragUploading, setDragUploading] = useState(false);

  // ======================================================
  // GEMINI
  // ======================================================

  const [showGemini, setShowGemini] = useState(false);
  const [geminiQuestion, setGeminiQuestion] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [geminiError, setGeminiError] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  // ======================================================
  // MOVE
  // ======================================================

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveBrowserFolder, setMoveBrowserFolder] = useState(null);
  const [moveFolderHistory, setMoveFolderHistory] = useState([]);
  const [moveFolders, setMoveFolders] = useState([]);
  const [loadingMoveFolders, setLoadingMoveFolders] = useState(false);
  const [movingFiles, setMovingFiles] = useState(false);

  // ======================================================
  // LOAD RECENT FILES
  // ======================================================

  const loadRecentFiles = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          "/recent"
        );

        setFiles(
          response.data.files || []
        );
      } catch (err) {
        console.error(
          "Load recent files error:",
          err
        );

        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "Unable to load recent files."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  // ======================================================
  // SEARCH + TYPE FILTER
  // ======================================================

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return files.filter((file) => {
      const displayName =
        getItemDisplayName(file);

      const matchesSearch =
        !normalizedQuery ||
        String(displayName || "")
          .toLowerCase()
          .includes(normalizedQuery);

      const fileType =
        getItemTypeKey(
          file,
          "file"
        );

      const matchesType =
        typeFilter === "all" ||
        fileType === typeFilter;

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [
    files,
    searchQuery,
    typeFilter,
  ]);

  // ======================================================
  // OPEN FILE
  // ======================================================

  const handleOpenFile = async (file) => {
    try {
      setError("");
      setMessage("");

      const fileType =
        getItemTypeKey(
          file,
          "file"
        );

      if (fileType === "document") {
        navigate(
          `/documents/${file.id}`,
          {
            state: {
              returnTo: "/recent",
            },
          }
        );

        return;
      }

      if (fileType === "spreadsheet") {
        navigate(
          `/spreadsheets/${file.id}`,
          {
            state: {
              returnTo: "/recent",
            },
          }
        );

        return;
      }

      if (fileType === "presentation") {
        navigate(
          `/presentations/${file.id}`,
          {
            state: {
              returnTo: "/recent",
            },
          }
        );

        return;
      }

      const response = await api.get(
        `/files/${file.id}`
      );

      const fileUrl =
        response.data?.downloadUrl ||
        response.data?.signedUrl ||
        response.data?.url ||
        response.data?.file?.downloadUrl ||
        response.data?.file?.signedUrl ||
        response.data?.file?.url;

      if (!fileUrl) {
        throw new Error(
          "Download URL not returned"
        );
      }

      window.open(
        fileUrl,
        "_blank",
        "noopener,noreferrer"
      );

      await loadRecentFiles();
    } catch (err) {
      console.error(
        "Open recent file error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to open file."
      );
    }
  };

  // ======================================================
  // SINGLE STAR / UNSTAR
  // ======================================================

  const handleToggleStar = async (file) => {
    try {
      setError("");
      setMessage("");

      const response = await api.patch(
        `/starred/files/${file.id}`
      );

      const isStarred =
        response.data?.file?.isStarred;

      setFiles((currentFiles) =>
        currentFiles.map((item) =>
          item.id === file.id
            ? {
                ...item,
                isStarred,
              }
            : item
        )
      );

      setSelectedFiles((currentFiles) =>
        currentFiles.map((item) =>
          item.id === file.id
            ? {
                ...item,
                isStarred,
              }
            : item
        )
      );

      const displayName =
        getItemDisplayName(file);

      setMessage(
        isStarred
          ? `"${displayName}" added to Starred.`
          : `"${displayName}" removed from Starred.`
      );
    } catch (err) {
      console.error(
        "Toggle recent star error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to update star status."
      );
    }
  };

  // ======================================================
  // SELECTION HELPERS
  // ======================================================

  const isFileSelected = (file) =>
    selectedFiles.some(
      (selected) =>
        String(selected.id) ===
        String(file.id)
    );

  const handleToggleSelection = (file) => {
    setSelectedFiles((current) => {
      const exists = current.some(
        (selected) =>
          String(selected.id) ===
          String(file.id)
      );

      if (exists) {
        return current.filter(
          (selected) =>
            String(selected.id) !==
            String(file.id)
        );
      }

      return [
        ...current,
        file,
      ];
    });
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setMoreOpen(false);
  };

  // ======================================================
  // MARQUEE SELECTION
  // ======================================================

  const handleSelectionPointerDown =
    (event) => {
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

      dragBaseSelectionRef.current =
        event.ctrlKey ||
        event.metaKey
          ? [...selectedFiles]
          : [];

      if (
        !event.ctrlKey &&
        !event.metaKey
      ) {
        setSelectedFiles([]);
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
        // Optional.
      }
    };

  const handleSelectionPointerMove =
    (event) => {
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
          dragBaseSelectionRef.current.map(
            (file) => [
              String(file.id),
              file,
            ]
          )
        );

      container
        .querySelectorAll(
          "[data-selectable-recent='true']"
        )
        .forEach((node) => {
          const itemRect =
            node.getBoundingClientRect();

          const intersects =
            itemRect.right >= left &&
            itemRect.left <= right &&
            itemRect.bottom >= top &&
            itemRect.top <= bottom;

          if (!intersects) {
            return;
          }

          const id =
            node.getAttribute(
              "data-file-id"
            );

          const file =
            filteredFiles.find(
              (item) =>
                String(item.id) ===
                String(id)
            );

          if (file) {
            merged.set(
              String(file.id),
              file
            );
          }
        });

      setSelectedFiles(
        Array.from(
          merged.values()
        )
      );
    };

  const handleSelectionPointerUp =
    (event) => {
      if (!dragSelection) {
        return;
      }

      try {
        event.currentTarget.releasePointerCapture(
          dragSelection.pointerId
        );
      } catch {
        // Optional.
      }

      setDragSelection(null);
    };


  // ======================================================
  // DRAG / DROP
  // ======================================================

  const uploadDroppedEntriesToMyDrive = async (
    droppedEntries
  ) => {
    if (
      !Array.isArray(droppedEntries) ||
      droppedEntries.length === 0
    ) {
      return;
    }

    setError("");
    setMessage("");

    const containsFolderStructure =
      droppedEntries.some((entry) =>
        String(
          entry.relativePath || ""
        ).includes("/")
      );

    try {
      setDragUploading(true);

      if (containsFolderStructure) {
        const formData =
          new FormData();

        const relativePaths = [];

        droppedEntries.forEach(
          (entry) => {
            if (!entry?.file) {
              return;
            }

            formData.append(
              "files",
              entry.file
            );

            relativePaths.push(
              entry.relativePath ||
                entry.file.name
            );
          }
        );

        formData.append(
          "relativePaths",
          JSON.stringify(
            relativePaths
          )
        );

        const response =
          await api.post(
            "/files/upload-folder",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const uploadedFiles =
          response.data?.uploaded
            ?.files ??
          droppedEntries.length;

        const uploadedFolders =
          response.data?.uploaded
            ?.folders ?? 0;

        setMessage(
          `Uploaded ${uploadedFiles} file${
            uploadedFiles === 1
              ? ""
              : "s"
          } and ${uploadedFolders} folder${
            uploadedFolders === 1
              ? ""
              : "s"
          } to My Drive.`
        );
      } else {
        const results =
          await Promise.allSettled(
            droppedEntries.map(
              async (entry) => {
                if (!entry?.file) {
                  throw new Error(
                    "Invalid dropped file."
                  );
                }

                const formData =
                  new FormData();

                formData.append(
                  "file",
                  entry.file
                );

                return api.post(
                  "/files/upload",
                  formData,
                  {
                    headers: {
                      "Content-Type":
                        "multipart/form-data",
                    },
                  }
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

        const uploadedCount =
          results.length -
          failed.length;

        if (uploadedCount > 0) {
          setMessage(
            `${uploadedCount} file${
              uploadedCount === 1
                ? ""
                : "s"
            } uploaded to My Drive.`
          );
        }

        if (failed.length > 0) {
          setError(
            `${failed.length} file${
              failed.length === 1
                ? ""
                : "s"
            } could not be uploaded.`
          );
        }
      }

      window.dispatchEvent(
        new Event(
          "cloud-drive-storage-changed"
        )
      );

      await loadRecentFiles(true);
    } catch (err) {
      console.error(
        "Recent drop upload error:",
        err
      );

      setError(
        err.response?.data?.error
          ?.message ||
          err.response?.data
            ?.message ||
          err.message ||
          "Unable to upload dropped items."
      );
    } finally {
      setDragUploading(false);
    }
  };

  const moveDroppedRecentFilesToMyDrive =
    async (droppedItems) => {
      if (
        !Array.isArray(
          droppedItems
        ) ||
        droppedItems.length === 0
      ) {
        return;
      }

      const validItems =
        droppedItems.filter(
          (entry) =>
            entry.resourceType ===
            "file"
        );

      if (!validItems.length) {
        setError(
          "Only files can be moved from Recent."
        );
        return;
      }

      try {
        setDragMoveCount(
          validItems.length
        );

        setError("");
        setMessage("");

        const results =
          await Promise.allSettled(
            validItems.map(
              (entry) =>
                api.patch(
                  `/files/${entry.id}`,
                  {
                    folderId: null,
                  }
                )
            )
          );

        const failed =
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          );

        const movedCount =
          results.length -
          failed.length;

        if (movedCount > 0) {
          setMessage(
            `${movedCount} file${
              movedCount === 1
                ? ""
                : "s"
            } moved to My Drive.`
          );
        }

        if (failed.length > 0) {
          setError(
            `${failed.length} file${
              failed.length === 1
                ? ""
                : "s"
            } could not be moved.`
          );
        }

        clearSelection();

        await loadRecentFiles(true);
      } catch (err) {
        console.error(
          "Recent drag move error:",
          err
        );

        setError(
          err.response?.data?.error
            ?.message ||
            err.response?.data
              ?.message ||
            "Unable to move dropped files."
        );
      } finally {
        setDragMoveCount(0);
      }
    };

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop,
  } = useDriveDragDrop({
    disabled: loading,
    onExternalDrop:
      uploadDroppedEntriesToMyDrive,
    onInternalDrop:
      moveDroppedRecentFilesToMyDrive,
  });

  const handleRecentFileDragStart =
    (file, event) => {
      const fileIsSelected =
        isFileSelected(file);

      const draggedFiles =
        fileIsSelected &&
        selectedFiles.length > 0
          ? selectedFiles
          : [file];

      if (!fileIsSelected) {
        setSelectedFiles([file]);
      }

      const records =
        draggedFiles.map(
          (draggedFile) => ({
            key: `file:${draggedFile.id}`,
            resourceType: "file",
            item: draggedFile,
          })
        );

      writeDriveDragPayload(
        event.dataTransfer,
        records
      );

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed =
          "move";
      }
    };

  // ======================================================
  // DOWNLOAD
  // ======================================================

  const handleDownloadSelected = async () => {
    if (!selectedFiles.length) {
      return;
    }

    let downloaded = 0;

    for (const file of selectedFiles) {
      const fileType =
        getItemTypeKey(
          file,
          "file"
        );

      if (
        [
          "document",
          "spreadsheet",
          "presentation",
        ].includes(fileType)
      ) {
        continue;
      }

      try {
        const response = await api.get(
          `/files/${file.id}`
        );

        const fileUrl =
          response.data?.downloadUrl ||
          response.data?.signedUrl ||
          response.data?.url ||
          response.data?.file?.downloadUrl ||
          response.data?.file?.signedUrl ||
          response.data?.file?.url;

        if (fileUrl) {
          window.open(
            fileUrl,
            "_blank",
            "noopener,noreferrer"
          );

          downloaded += 1;
        }
      } catch {
        // Continue processing other files.
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

  // ======================================================
  // SHARE
  // ======================================================

  const handleShareSelected = async () => {
    if (!selectedFiles.length) {
      return;
    }

    const email = window.prompt(
      "Enter the registered user's email:"
    );

    if (!email?.trim()) {
      return;
    }

    const permissionInput =
      window.prompt(
        "Permission: viewer or editor",
        "viewer"
      );

    const permission =
      permissionInput === "editor"
        ? "editor"
        : "viewer";

    try {
      setError("");
      setMessage("");

      const results =
        await Promise.allSettled(
          selectedFiles.map(
            (file) =>
              api.post(
                "/shares",
                {
                  email:
                    email
                      .trim()
                      .toLowerCase(),
                  permission,
                  fileId: file.id,
                }
              )
          )
        );

      const failed =
        results.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      const sharedCount =
        results.length -
        failed.length;

      if (sharedCount > 0) {
        setMessage(
          `${sharedCount} file${
            sharedCount === 1 ? "" : "s"
          } shared successfully.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} file${
            failed.length === 1 ? "" : "s"
          } could not be shared.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to share selected files."
      );
    }
  };

  // ======================================================
  // COPY LINKS
  // ======================================================

  const buildFileLink = (file) => {
    const fileType =
      getItemTypeKey(
        file,
        "file"
      );

    if (fileType === "document") {
      return `${window.location.origin}/documents/${file.id}`;
    }

    if (fileType === "spreadsheet") {
      return `${window.location.origin}/spreadsheets/${file.id}`;
    }

    if (fileType === "presentation") {
      return `${window.location.origin}/presentations/${file.id}`;
    }

    return `${window.location.origin}/dashboard?file=${file.id}`;
  };

  const handleCopyLinks = async () => {
    if (!selectedFiles.length) {
      return;
    }

    try {
      const links =
        selectedFiles.map(
          buildFileLink
        );

      await navigator.clipboard.writeText(
        links.join("\n")
      );

      setMessage(
        selectedFiles.length === 1
          ? "Link copied."
          : `${selectedFiles.length} links copied.`
      );
    } catch {
      setError(
        "Unable to copy the selected links."
      );
    }
  };

  // ======================================================
  // TRASH
  // ======================================================

  const handleTrashSelected = async () => {
    if (!selectedFiles.length) {
      return;
    }

    const confirmed =
      window.confirm(
        `Move ${
          selectedFiles.length
        } selected file${
          selectedFiles.length === 1
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
          selectedFiles.map(
            (file) =>
              api.delete(
                `/files/${file.id}`
              )
          )
        );

      const failed =
        results.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      const deletedCount =
        results.length -
        failed.length;

      if (deletedCount > 0) {
        setMessage(
          `${deletedCount} file${
            deletedCount === 1
              ? ""
              : "s"
          } moved to Trash.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} file${
            failed.length === 1
              ? ""
              : "s"
          } could not be moved to Trash.`
        );
      }

      clearSelection();

      await loadRecentFiles(true);

      window.dispatchEvent(
        new Event(
          "cloud-drive-storage-changed"
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to move selected files to Trash."
      );
    }
  };

  // ======================================================
  // BULK STAR
  // ======================================================

  const handleToggleSelectedStar = async () => {
    if (!selectedFiles.length) {
      return;
    }

    const shouldStar =
      selectedFiles.some(
        (file) =>
          !file.isStarred
      );

    try {
      setError("");

      const results =
        await Promise.allSettled(
          selectedFiles.map(
            async (file) => {
              if (
                Boolean(
                  file.isStarred
                ) === shouldStar
              ) {
                return null;
              }

              return api.patch(
                `/starred/files/${file.id}`
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

      setMessage(
        shouldStar
          ? "Selected files added to Starred."
          : "Selected files removed from Starred."
      );

      if (failed.length > 0) {
        setError(
          `${failed.length} file${
            failed.length === 1
              ? ""
              : "s"
          } could not be updated.`
        );
      }

      clearSelection();

      await loadRecentFiles(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to update Starred status."
      );
    }
  };

  // ======================================================
  // MOVE
  // ======================================================

  const loadMoveFolder = async (
    folder = null
  ) => {
    try {
      setLoadingMoveFolders(true);

      const endpoint =
        folder?.id
          ? `/folders/${folder.id}`
          : "/folders/root";

      const response =
        await api.get(endpoint);

      setMoveFolders(
        response.data?.folders || []
      );
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to load destination folders."
      );
    } finally {
      setLoadingMoveFolders(false);
    }
  };

  const openMoveSelected = async () => {
    if (!selectedFiles.length) {
      return;
    }

    setShowMoveModal(true);
    setMoveBrowserFolder(null);
    setMoveFolderHistory([]);

    await loadMoveFolder(null);
  };

  const handleBrowseMoveFolder =
    async (folder) => {
      setMoveFolderHistory(
        (current) => [
          ...current,
          moveBrowserFolder,
        ]
      );

      setMoveBrowserFolder(
        folder
      );

      await loadMoveFolder(
        folder
      );
    };

  const handleMoveBack = async () => {
    if (
      moveFolderHistory.length === 0
    ) {
      setMoveBrowserFolder(null);
      await loadMoveFolder(null);
      return;
    }

    const history = [
      ...moveFolderHistory,
    ];

    const previous =
      history.pop();

    setMoveFolderHistory(
      history
    );

    setMoveBrowserFolder(
      previous || null
    );

    await loadMoveFolder(
      previous || null
    );
  };

  const handleConfirmMove = async () => {
    if (!selectedFiles.length) {
      return;
    }

    try {
      setMovingFiles(true);
      setError("");
      setMessage("");

      const destinationId =
        moveBrowserFolder?.id ||
        null;

      const results =
        await Promise.allSettled(
          selectedFiles.map(
            (file) =>
              api.patch(
                `/files/${file.id}`,
                {
                  folderId:
                    destinationId,
                }
              )
          )
        );

      const failed =
        results.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      const movedCount =
        results.length -
        failed.length;

      if (movedCount > 0) {
        setMessage(
          `${movedCount} file${
            movedCount === 1 ? "" : "s"
          } moved successfully.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} file${
            failed.length === 1 ? "" : "s"
          } could not be moved.`
        );
      }

      setShowMoveModal(false);
      setMoveBrowserFolder(null);
      setMoveFolderHistory([]);
      setMoveFolders([]);
      clearSelection();

      await loadRecentFiles(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to move selected files."
      );
    } finally {
      setMovingFiles(false);
    }
  };

  // ======================================================
  // GEMINI
  // ======================================================

  const handleAskGemini = async () => {
    const question =
      geminiQuestion.trim();

    if (
      !question ||
      !selectedFiles.length
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
              selectedFiles.map(
                (file) => ({
                  id: file.id,
                  resourceType:
                    "file",
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

  // ======================================================
  // DERIVED
  // ======================================================

  const isEmpty =
    !loading &&
    files.length === 0;

  const noMatches =
    !loading &&
    files.length > 0 &&
    filteredFiles.length === 0;

  const allSelectedStarred =
    selectedFiles.length > 0 &&
    selectedFiles.every(
      (file) =>
        file.isStarred
    );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      {...dropZoneProps}
      className={`relative min-h-screen p-6 transition-colors duration-200 lg:p-8 ${
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
          dragUploading ||
          dragMoveCount > 0
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
        description={
          isInternalDragActive
            ? "Recent is a view, so dropped Cloud Drive files will be moved to My Drive root."
            : "Recent is a view, so files and folders dropped here will be uploaded to My Drive root."
        }
      />

      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Clock3 size={22} />
            </div>

            <div>
              <h1
                className={`text-3xl font-bold tracking-tight ${
                  isDark
                    ? "text-slate-100"
                    : "text-slate-950"
                }`}
              >
                Recent
              </h1>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Files you've opened recently.
              </p>
            </div>
          </div>

          {!loading &&
            files.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  loadRecentFiles(true)
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
            )}
        </div>

        {/* SEARCH / FILTER / VIEW */}

        {!loading &&
          files.length > 0 && (
            <div className="mb-6">
              <DriveToolbar
                searchQuery={
                  searchQuery
                }
                onSearchChange={(value) => {
                  setSearchQuery(value);
                  clearSelection();
                }}
                searchPlaceholder="Search recent files..."
                typeFilter={
                  typeFilter
                }
                onTypeFilterChange={(value) => {
                  setTypeFilter(value);
                  clearSelection();
                }}
                typeOptions={
                  FILE_TYPE_OPTIONS
                }
                viewMode={
                  viewMode
                }
                onViewModeChange={
                  handleViewModeChange
                }
                isDark={isDark}
              />
            </div>
          )}

        {/* SELECTION TOOLBAR */}

        {selectedFiles.length > 0 && (
          <div
            className={`relative mb-6 flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border px-4 shadow-sm ${
              isDark
                ? "border-violet-500/30 bg-slate-800 text-slate-200"
                : "border-violet-200 bg-violet-50 text-slate-700"
            }`}
          >
            <ActionButton
              title="Clear selection"
              isDark={isDark}
              onClick={
                clearSelection
              }
            >
              <X size={22} />
            </ActionButton>

            <span className="min-w-[105px] text-[15px] font-semibold">
              {selectedFiles.length} selected
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
              onClick={() => {
                setGeminiQuestion("");
                setGeminiResponse("");
                setGeminiError("");
                setShowGemini(true);
              }}
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
              title="Share"
              isDark={isDark}
              onClick={
                handleShareSelected
              }
            >
              <Users size={20} />
            </ActionButton>

            <ActionButton
              title="Download"
              isDark={isDark}
              onClick={
                handleDownloadSelected
              }
            >
              <Download size={20} />
            </ActionButton>

            <ActionButton
              title="Move"
              isDark={isDark}
              onClick={
                openMoveSelected
              }
            >
              <Move size={20} />
            </ActionButton>

            <ActionButton
              title="Move to Trash"
              isDark={isDark}
              danger
              onClick={
                handleTrashSelected
              }
            >
              <Trash2 size={20} />
            </ActionButton>

            <ActionButton
              title="Copy link"
              isDark={isDark}
              onClick={
                handleCopyLinks
              }
            >
              <Link2 size={20} />
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
                  size={21}
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
                      <Star
                        size={17}
                      />
                    }
                    label={
                      allSelectedStarred
                        ? "Remove from Starred"
                        : "Add to Starred"
                    }
                    onClick={() => {
                      setMoreOpen(false);
                      handleToggleSelectedStar();
                    }}
                  />

                  <MenuButton
                    isDark={isDark}
                    icon={
                      <Share2
                        size={17}
                      />
                    }
                    label="Share"
                    onClick={() => {
                      setMoreOpen(false);
                      handleShareSelected();
                    }}
                  />

                  <MenuButton
                    isDark={isDark}
                    icon={
                      <Download
                        size={17}
                      />
                    }
                    label="Download"
                    onClick={() => {
                      setMoreOpen(false);
                      handleDownloadSelected();
                    }}
                  />

                  <MenuButton
                    isDark={isDark}
                    icon={
                      <Move
                        size={17}
                      />
                    }
                    label="Move"
                    onClick={() => {
                      setMoreOpen(false);
                      openMoveSelected();
                    }}
                  />

                  <MenuButton
                    isDark={isDark}
                    icon={
                      <Link2
                        size={17}
                      />
                    }
                    label="Copy link"
                    onClick={() => {
                      setMoreOpen(false);
                      handleCopyLinks();
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
                      handleTrashSelected();
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
                      clearSelection();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
              isDark
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
              isDark
                ? "border-red-500/20 bg-red-500/10 text-red-300"
                : "border-red-100 bg-red-50 text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[430px] items-center justify-center">
            <div
              className={`flex flex-col items-center gap-3 ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              <Loader2
                size={30}
                className="animate-spin text-violet-500"
              />

              <p className="text-sm font-medium">
                Loading recent files...
              </p>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {isEmpty && (
          <div className="flex min-h-[460px] items-center justify-center">
            <div className="text-center">

              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
                  isDark
                    ? "bg-indigo-500/10"
                    : "bg-indigo-50"
                }`}
              >
                <Clock3
                  size={34}
                  className={
                    isDark
                      ? "text-indigo-400"
                      : "text-indigo-300"
                  }
                />
              </div>

              <h2
                className={`mt-5 text-lg font-semibold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-700"
                }`}
              >
                No recent files
              </h2>

              <p
                className={`mt-2 text-sm ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Files you open will appear here.
              </p>

            </div>
          </div>
        )}

        {/* NO SEARCH RESULTS */}

        {noMatches && (
          <div
            className={`rounded-3xl border px-6 py-16 text-center ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <Clock3
              size={36}
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
              No matching files
            </h2>

            <p
              className={`mt-2 text-sm ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Try another name or file type.
            </p>
          </div>
        )}

        {/* FILES */}

        {!loading &&
          filteredFiles.length > 0 && (
            <section
              ref={selectionAreaRef}
              onPointerDown={
                handleSelectionPointerDown
              }
              onPointerMove={
                handleSelectionPointerMove
              }
              onPointerUp={
                handleSelectionPointerUp
              }
              onPointerCancel={
                handleSelectionPointerUp
              }
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

              <div className="mb-5 flex items-center justify-between">
                <h2
                  className={`text-xs font-bold uppercase tracking-[0.18em] ${
                    isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  Recent files
                </h2>

                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium ${
                    isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-white text-slate-500 shadow-sm"
                  }`}
                >
                  {filteredFiles.length}
                </span>
              </div>

              {viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredFiles.map(
                    (file) => (
                      <RecentFileCard
                        key={file.id}
                        file={file}
                        isDark={isDark}
                        selected={
                          isFileSelected(file)
                        }
                        onSelect={() =>
                          handleToggleSelection(file)
                        }
                        onOpen={
                          handleOpenFile
                        }
                        onToggleStar={
                          handleToggleStar
                        }
                        onDragStart={
                          handleRecentFileDragStart
                        }
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
                  {/* LIST HEADER */}

                  <div
                    className={`hidden grid-cols-[40px_minmax(0,1fr)_150px_150px_80px] gap-4 border-b px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] md:grid ${
                      isDark
                        ? "border-slate-800 text-slate-500"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <div />
                    <div>Name</div>
                    <div>Type</div>
                    <div>Last opened</div>
                    <div />
                  </div>

                  {filteredFiles.map(
                    (file) => (
                      <RecentFileRow
                        key={file.id}
                        file={file}
                        isDark={isDark}
                        selected={
                          isFileSelected(file)
                        }
                        onSelect={() =>
                          handleToggleSelection(file)
                        }
                        onOpen={
                          handleOpenFile
                        }
                        onToggleStar={
                          handleToggleStar
                        }
                        onDragStart={
                          handleRecentFileDragStart
                        }
                      />
                    )
                  )}
                </div>
              )}

            </section>
          )}

      </div>

      {/* MOVE MODAL */}

      {showMoveModal && (
        <MoveModal
          currentFolder={
            moveBrowserFolder
          }
          folders={
            moveFolders
          }
          canGoBack={
            Boolean(
              moveBrowserFolder
            ) ||
            moveFolderHistory.length > 0
          }
          loading={
            loadingMoveFolders
          }
          moving={
            movingFiles
          }
          isDark={isDark}
          onBrowse={
            handleBrowseMoveFolder
          }
          onBack={
            handleMoveBack
          }
          onMove={
            handleConfirmMove
          }
          onClose={() => {
            if (movingFiles) {
              return;
            }

            setShowMoveModal(false);
            setMoveBrowserFolder(null);
            setMoveFolderHistory([]);
            setMoveFolders([]);
          }}
        />
      )}

      {/* GEMINI MODAL */}

      {showGemini && (
        <GeminiModal
          selectedCount={
            selectedFiles.length
          }
          question={
            geminiQuestion
          }
          setQuestion={
            setGeminiQuestion
          }
          response={
            geminiResponse
          }
          error={
            geminiError
          }
          loading={
            geminiLoading
          }
          isDark={isDark}
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

// ======================================================
// GRID CARD
// ======================================================

function RecentFileCard({
  file,
  isDark,
  selected,
  onSelect,
  onOpen,
  onToggleStar,
  onDragStart,
}) {
  const config =
    getItemTypeConfig(
      file,
      "file"
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon =
    config.icon;

  const displayName =
    getItemDisplayName(file);

  return (
    <div
      data-selectable-recent="true"
      data-file-id={file.id}
      draggable
      onDragStart={(event) =>
        onDragStart(file, event)
      }
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        selected
          ? isDark
            ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25"
            : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
          : isDark
            ? `bg-slate-900 shadow-black/20 ${colors.border}`
            : `bg-white shadow-sm hover:shadow-slate-200/50 ${colors.border}`
      }`}
    >
      <div className="absolute left-3 top-3 z-30">
        <SelectionCheckbox
          selected={selected}
          isDark={isDark}
          onClick={onSelect}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        data-no-marquee="true"
        onClick={() =>
          onOpen(file)
        }
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            onOpen(file);
          }
        }}
        className="cursor-pointer p-4"
      >
        <div
          className={`relative mb-4 flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${colors.preview}`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${
              isDark
                ? "bg-slate-900/90"
                : "bg-white"
            } ${colors.icon}`}
          >
            <Icon
              size={34}
              strokeWidth={1.8}
            />
          </div>

          <span
            className={`absolute bottom-2.5 left-2.5 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] ${colors.badge}`}
          >
            {config.badge}
          </span>
        </div>

        <div className="flex items-start gap-2">

          <div className="min-w-0 flex-1">
            <p
              title={displayName}
              className={`truncate font-semibold ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-800"
              }`}
            >
              {displayName}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${colors.badge}`}
              >
                {config.label}
              </span>

              <span
                className={`text-xs ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                {formatFileSize(
                  file.sizeBytes
                )}
              </span>
            </div>
          </div>

          <StarButton
            file={file}
            isDark={isDark}
            onToggleStar={
              onToggleStar
            }
          />

        </div>
      </div>

      <div
        className={`mx-4 border-t pb-4 pt-3 ${
          isDark
            ? "border-slate-800"
            : "border-slate-100"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-xs ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          <Clock3 size={14} />

          <span>
            Opened{" "}
            {formatRelativeTime(
              file.lastAccessedAt ||
                file.last_accessed_at
            )}
          </span>
        </div>
      </div>

    </div>
  );
}

// ======================================================
// LIST ROW
// ======================================================

function RecentFileRow({
  file,
  isDark,
  selected,
  onSelect,
  onOpen,
  onToggleStar,
  onDragStart,
}) {
  const config =
    getItemTypeConfig(
      file,
      "file"
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon =
    config.icon;

  const displayName =
    getItemDisplayName(file);

  return (
    <div
      data-selectable-recent="true"
      data-file-id={file.id}
      draggable
      onDragStart={(event) =>
        onDragStart(file, event)
      }
      className={`group grid min-h-[72px] grid-cols-[40px_minmax(0,1fr)_150px_150px_80px] items-center gap-4 border-b px-5 transition last:border-b-0 ${
        selected
          ? isDark
            ? "border-violet-500/30 bg-violet-500/15 ring-1 ring-inset ring-violet-400/40"
            : "border-violet-200 bg-violet-50 ring-1 ring-inset ring-violet-200"
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
        onClick={() =>
          onOpen(file)
        }
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon
            size={22}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <p
            title={displayName}
            className={`truncate font-semibold ${
              isDark
                ? "text-slate-100"
                : "text-slate-800"
            }`}
          >
            {displayName}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            {formatFileSize(
              file.sizeBytes
            )}
          </p>
        </div>
      </button>

      <div>
        <span
          className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-[0.06em] ${colors.badge}`}
        >
          {config.badge}
        </span>

        <p
          className={`mt-1 text-xs ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {config.label}
        </p>
      </div>

      <div
        className={`flex items-center gap-2 text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        <Clock3
          size={15}
          className={
            isDark
              ? "text-slate-600"
              : "text-slate-400"
          }
        />

        {formatRelativeTime(
          file.lastAccessedAt ||
            file.last_accessed_at
        )}
      </div>

      <div className="flex justify-center">
        <StarButton
          file={file}
          isDark={isDark}
          onToggleStar={
            onToggleStar
          }
        />
      </div>

    </div>
  );
}

// ======================================================
// SELECTION CHECKBOX
// ======================================================

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

// ======================================================
// STAR BUTTON
// ======================================================

function StarButton({
  file,
  isDark,
  onToggleStar,
}) {
  return (
    <button
      type="button"
      data-no-marquee="true"
      onClick={(event) => {
        event.stopPropagation();

        onToggleStar(file);
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
        isDark
          ? "hover:bg-amber-500/10"
          : "hover:bg-amber-50"
      }`}
      title={
        file.isStarred
          ? "Remove from Starred"
          : "Add to Starred"
      }
    >
      <Star
        size={18}
        className={
          file.isStarred
            ? "fill-amber-400 text-amber-400"
            : isDark
              ? "text-slate-600 transition hover:text-amber-400"
              : "text-slate-300 transition hover:text-amber-400"
        }
      />
    </button>
  );
}

// ======================================================
// ACTION BUTTON
// ======================================================

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

// ======================================================
// MENU BUTTON
// ======================================================

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

// ======================================================
// MOVE MODAL
// ======================================================

function MoveModal({
  currentFolder,
  folders,
  canGoBack,
  loading,
  moving,
  isDark,
  onBrowse,
  onBack,
  onMove,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">

      <div
        className={`w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <div
          className={`flex items-start justify-between border-b px-6 py-5 ${
            isDark
              ? "border-slate-800"
              : "border-slate-100"
          }`}
        >
          <div>
            <h2
              className={`text-xl font-bold ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-900"
              }`}
            >
              Move selected files
            </h2>

            <p
              className={`mt-1 text-sm ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Choose the destination folder.
            </p>
          </div>

          <button
            type="button"
            disabled={moving}
            onClick={onClose}
            className={
              isDark
                ? "rounded-xl p-2 text-slate-500 hover:bg-slate-800"
                : "rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">

          <div className="mb-4 flex items-center gap-2">

            {canGoBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  isDark
                    ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-4 py-3 ${
                isDark
                  ? "bg-slate-800"
                  : "bg-slate-50"
              }`}
            >
              <FolderOpen
                size={18}
                className="text-violet-500"
              />

              <span
                className={`truncate text-sm font-semibold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-700"
                }`}
              >
                {currentFolder
                  ? currentFolder.name
                  : "My Drive"}
              </span>
            </div>
          </div>

          <div
            className={`max-h-[330px] min-h-[220px] overflow-y-auto rounded-2xl border ${
              isDark
                ? "border-slate-700"
                : "border-slate-200"
            }`}
          >
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <RefreshCw
                  size={24}
                  className="animate-spin text-violet-500"
                />
              </div>
            ) : folders.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center px-6 text-center">
                <p
                  className={
                    isDark
                      ? "text-sm text-slate-500"
                      : "text-sm text-slate-500"
                  }
                >
                  No folders inside this location
                </p>
              </div>
            ) : (
              folders.map(
                (folder) => (
                  <button
                    key={
                      folder.id
                    }
                    type="button"
                    onClick={() =>
                      onBrowse(
                        folder
                      )
                    }
                    className={`flex w-full items-center gap-3 border-b px-4 py-3.5 text-left last:border-b-0 ${
                      isDark
                        ? "border-slate-800 hover:bg-slate-800"
                        : "border-slate-100 hover:bg-violet-50"
                    }`}
                  >
                    <FolderOpen
                      size={20}
                      className="text-amber-500"
                    />

                    <span
                      className={`min-w-0 flex-1 truncate text-sm font-semibold ${
                        isDark
                          ? "text-slate-200"
                          : "text-slate-700"
                      }`}
                    >
                      {
                        folder.name
                      }
                    </span>

                    <ChevronRight
                      size={18}
                      className="text-slate-400"
                    />
                  </button>
                )
              )
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              disabled={moving}
              onClick={onClose}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                moving ||
                loading
              }
              onClick={onMove}
              className="flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {moving ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                  Moving...
                </>
              ) : (
                <>
                  <Move size={17} />
                  Move here
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// GEMINI MODAL
// ======================================================

function GeminiModal({
  selectedCount,
  question,
  setQuestion,
  response,
  error,
  loading,
  isDark,
  onAsk,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">

      <div
        className={`max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-start justify-between">

          <div className="flex gap-3">
            <Sparkles
              size={24}
              className="text-violet-500"
            />

            <div>
              <h2
                className={`text-xl font-bold ${
                  isDark
                    ? "text-slate-100"
                    : "text-slate-900"
                }`}
              >
                Ask Gemini
              </h2>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                {selectedCount} selected file
                {selectedCount === 1
                  ? ""
                  : "s"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={
              isDark
                ? "rounded-xl p-2 text-slate-500 hover:bg-slate-800"
                : "rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            }
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          rows={4}
          placeholder="Ask something about the selected recent files..."
          className={`mt-6 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none ${
            isDark
              ? "border-slate-700 bg-slate-950 text-slate-100"
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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {response && (
          <div
            className={`mt-5 whitespace-pre-wrap rounded-2xl border p-5 text-sm leading-7 ${
              isDark
                ? "border-violet-500/20 bg-violet-500/10 text-slate-200"
                : "border-violet-100 bg-violet-50 text-slate-700"
            }`}
          >
            {response}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================================================
// FILE SIZE
// ======================================================

function formatFileSize(bytes) {
  const value =
    Number(bytes || 0);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
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

// ======================================================
// RELATIVE TIME
// ======================================================

function formatRelativeTime(dateString) {
  if (!dateString) {
    return "recently";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "recently";
  }

  const now = new Date();

  const difference = Math.max(
    0,
    now.getTime() -
      date.getTime()
  );

  const minutes = Math.floor(
    difference /
      (1000 * 60)
  );

  const hours = Math.floor(
    difference /
      (1000 * 60 * 60)
  );

  const days = Math.floor(
    difference /
      (1000 * 60 * 60 * 24)
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default RecentPage;
