import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FolderOpen,
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
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import api from "../api/axios";
import DriveToolbar from "../components/DriveToolbar";

import {
  getItemDisplayName,
  getItemTypeConfig,
  getItemTypeKey,
} from "../utils/fileTypeConfig";

// ======================================================
// TYPE FILTER OPTIONS
// ======================================================

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
  { value: "other", label: "Other files" },
];

// ======================================================
// HELPERS
// ======================================================

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

  const size =
    value / Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : size < 10 ? 2 : 1
  )} ${units[index]}`;
}

function StarredPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ======================================================
  // TOOLBAR
  // ======================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [viewMode, setViewMode] = useState(() => {
    return (
      localStorage.getItem("starredViewMode") ||
      settings?.defaultView ||
      "grid"
    );
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("starredViewMode", mode);
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

  const [selectedItems, setSelectedItems] = useState([]);
  const [dragSelection, setDragSelection] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const selectionAreaRef = useRef(null);
  const dragBaseSelectionRef = useRef([]);

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
  const [movingItems, setMovingItems] = useState(false);

  // ======================================================
  // FETCH STARRED ITEMS
  // ======================================================

  const fetchStarredItems = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get("/starred");

        setFiles(
          response.data.files || []
        );

        setFolders(
          response.data.folders || []
        );
      } catch (err) {
        console.error(
          "Unable to fetch starred items:",
          err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "Unable to load starred items."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchStarredItems();
  }, [fetchStarredItems]);

  // ======================================================
  // SEARCH + FILTER
  // ======================================================

  const filteredFolders = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return folders.filter((folder) => {
      const matchesSearch =
        !query ||
        String(folder.name || "")
          .toLowerCase()
          .includes(query);

      const folderType =
        folder.isProject ||
        folder.is_project
          ? "project"
          : "folder";

      const matchesType =
        typeFilter === "all" ||
        typeFilter === folderType;

      return matchesSearch && matchesType;
    });
  }, [
    folders,
    searchQuery,
    typeFilter,
  ]);

  const filteredFiles = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return files.filter((file) => {
      const displayName =
        getItemDisplayName(file);

      const matchesSearch =
        !query ||
        String(displayName || "")
          .toLowerCase()
          .includes(query);

      const fileType =
        getItemTypeKey(
          file,
          "file"
        );

      const matchesType =
        typeFilter === "all" ||
        typeFilter === fileType;

      return matchesSearch && matchesType;
    });
  }, [
    files,
    searchQuery,
    typeFilter,
  ]);

  const selectableItems = useMemo(
    () => [
      ...filteredFolders.map(
        (folder) => ({
          key: `folder:${folder.id}`,
          resourceType: "folder",
          item: folder,
        })
      ),
      ...filteredFiles.map(
        (file) => ({
          key: `file:${file.id}`,
          resourceType: "file",
          item: file,
        })
      ),
    ],
    [
      filteredFolders,
      filteredFiles,
    ]
  );

  // ======================================================
  // OPEN FOLDER / PROJECT
  // ======================================================

  const handleOpenFolder = (folder) => {
    const isProject =
      folder.isProject ||
      folder.is_project;

    if (isProject) {
      navigate(
        `/projects/${folder.id}`,
        {
          state: {
            project: folder,
          },
        }
      );
      return;
    }

    navigate(
      `/dashboard?folder=${folder.id}`
    );
  };

  // ======================================================
  // OPEN REGULAR FILE
  // ======================================================

  const openRegularFile = async (file) => {
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
        "Download URL not returned by backend"
      );
    }

    window.open(
      fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

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
              returnTo: "/starred",
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
              returnTo: "/starred",
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
              returnTo: "/starred",
            },
          }
        );
        return;
      }

      await openRegularFile(file);
    } catch (err) {
      console.error(
        "Open file error:",
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
  // SINGLE UNSTAR
  // ======================================================

  const handleUnstarFile = async (file) => {
    try {
      setError("");
      setMessage("");

      await api.patch(
        `/starred/files/${file.id}`
      );

      setFiles((currentFiles) =>
        currentFiles.filter(
          (item) =>
            item.id !== file.id
        )
      );

      setSelectedItems((current) =>
        current.filter(
          (entry) =>
            !(
              entry.resourceType === "file" &&
              String(entry.item.id) ===
                String(file.id)
            )
        )
      );

      setMessage(
        `"${getItemDisplayName(
          file
        )}" removed from Starred.`
      );
    } catch (err) {
      console.error(
        "Unstar file error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to unstar file."
      );
    }
  };

  const handleUnstarFolder = async (folder) => {
    try {
      setError("");
      setMessage("");

      await api.patch(
        `/starred/folders/${folder.id}`
      );

      setFolders((currentFolders) =>
        currentFolders.filter(
          (item) =>
            item.id !== folder.id
        )
      );

      setSelectedItems((current) =>
        current.filter(
          (entry) =>
            !(
              entry.resourceType === "folder" &&
              String(entry.item.id) ===
                String(folder.id)
            )
        )
      );

      setMessage(
        `"${folder.name}" removed from Starred.`
      );
    } catch (err) {
      console.error(
        "Unstar folder error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to unstar folder."
      );
    }
  };

  // ======================================================
  // SELECTION
  // ======================================================

  const isSelected = (
    resourceType,
    item
  ) => {
    const key =
      `${resourceType}:${item.id}`;

    return selectedItems.some(
      (selected) =>
        selected.key === key
    );
  };

  const toggleSelection = (
    resourceType,
    item
  ) => {
    const key =
      `${resourceType}:${item.id}`;

    setSelectedItems((current) => {
      const exists =
        current.some(
          (selected) =>
            selected.key === key
        );

      if (exists) {
        return current.filter(
          (selected) =>
            selected.key !== key
        );
      }

      return [
        ...current,
        {
          key,
          resourceType,
          item,
        },
      ];
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setMoreOpen(false);
  };

  // ======================================================
  // MARQUEE SELECTION
  // ======================================================

  const handleSelectionPointerDown = (
    event
  ) => {
    if (event.button !== 0) {
      return;
    }

    if (
      event.target.closest(
        "button,input,textarea,select,a,[data-no-marquee='true']"
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
      // Optional.
    }
  };

  const handleSelectionPointerMove = (
    event
  ) => {
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
          (entry) => [
            entry.key,
            entry,
          ]
        )
      );

    container
      .querySelectorAll(
        "[data-selectable-starred='true']"
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

        const key =
          node.getAttribute(
            "data-selection-key"
          );

        const entry =
          selectableItems.find(
            (candidate) =>
              candidate.key === key
          );

        if (entry) {
          merged.set(
            entry.key,
            entry
          );
        }
      });

    setSelectedItems(
      Array.from(
        merged.values()
      )
    );
  };

  const handleSelectionPointerUp = (
    event
  ) => {
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
  // DOWNLOAD
  // ======================================================

  const handleDownloadSelected = async () => {
    const selectedFiles =
      selectedItems.filter(
        (entry) =>
          entry.resourceType === "file"
      );

    if (!selectedFiles.length) {
      setError(
        "Select at least one file to download."
      );
      return;
    }

    let downloaded = 0;

    for (const selected of selectedFiles) {
      const file =
        selected.item;

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
        const response =
          await api.get(
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
    if (!selectedItems.length) {
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
          selectedItems.map(
            (selected) => {
              const payload = {
                email:
                  email
                    .trim()
                    .toLowerCase(),
                permission,
              };

              if (
                selected.resourceType ===
                "folder"
              ) {
                payload.folderId =
                  selected.item.id;
              } else {
                payload.fileId =
                  selected.item.id;
              }

              return api.post(
                "/shares",
                payload
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

      const sharedCount =
        results.length -
        failed.length;

      if (sharedCount > 0) {
        setMessage(
          `${sharedCount} item${
            sharedCount === 1 ? "" : "s"
          } shared successfully.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be shared.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to share selected items."
      );
    }
  };

  // ======================================================
  // COPY LINK
  // ======================================================

  const buildItemLink = (
    resourceType,
    item
  ) => {
    if (resourceType === "folder") {
      const isProject =
        item.isProject ||
        item.is_project;

      if (isProject) {
        return `${window.location.origin}/projects/${item.id}`;
      }

      return `${window.location.origin}/dashboard?folder=${item.id}`;
    }

    const fileType =
      getItemTypeKey(
        item,
        "file"
      );

    if (fileType === "document") {
      return `${window.location.origin}/documents/${item.id}`;
    }

    if (fileType === "spreadsheet") {
      return `${window.location.origin}/spreadsheets/${item.id}`;
    }

    if (fileType === "presentation") {
      return `${window.location.origin}/presentations/${item.id}`;
    }

    return `${window.location.origin}/dashboard?file=${item.id}`;
  };

  const handleCopyLinks = async () => {
    if (!selectedItems.length) {
      return;
    }

    try {
      const links =
        selectedItems.map(
          (selected) =>
            buildItemLink(
              selected.resourceType,
              selected.item
            )
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

  // ======================================================
  // TRASH
  // ======================================================

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

      const deletedCount =
        results.length -
        failed.length;

      if (deletedCount > 0) {
        setMessage(
          `${deletedCount} item${
            deletedCount === 1 ? "" : "s"
          } moved to Trash.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be moved to Trash.`
        );
      }

      clearSelection();
      await fetchStarredItems(true);

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

  // ======================================================
  // UNSTAR SELECTED
  // ======================================================

  const handleUnstarSelected = async () => {
    if (!selectedItems.length) {
      return;
    }

    try {
      setError("");
      setMessage("");

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

      const successCount =
        results.length -
        failed.length;

      if (successCount > 0) {
        setMessage(
          `${successCount} item${
            successCount === 1 ? "" : "s"
          } removed from Starred.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be unstarred.`
        );
      }

      clearSelection();
      await fetchStarredItems(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to unstar selected items."
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

      const selectedFolderIds =
        new Set(
          selectedItems
            .filter(
              (entry) =>
                entry.resourceType ===
                "folder"
            )
            .map(
              (entry) =>
                String(
                  entry.item.id
                )
            )
        );

      setMoveFolders(
        (
          response.data?.folders ||
          []
        ).filter(
          (folderItem) =>
            !selectedFolderIds.has(
              String(
                folderItem.id
              )
            )
        )
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
    if (!selectedItems.length) {
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
    if (!selectedItems.length) {
      return;
    }

    try {
      setMovingItems(true);
      setError("");
      setMessage("");

      const destinationId =
        moveBrowserFolder?.id ||
        null;

      const results =
        await Promise.allSettled(
          selectedItems.map(
            (selected) => {
              if (
                selected.resourceType ===
                "folder"
              ) {
                return api.patch(
                  `/folders/${selected.item.id}`,
                  {
                    parentId:
                      destinationId,
                  }
                );
              }

              return api.patch(
                `/files/${selected.item.id}`,
                {
                  folderId:
                    destinationId,
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

      const movedCount =
        results.length -
        failed.length;

      if (movedCount > 0) {
        setMessage(
          `${movedCount} item${
            movedCount === 1 ? "" : "s"
          } moved successfully.`
        );
      }

      if (failed.length > 0) {
        setError(
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be moved.`
        );
      }

      setShowMoveModal(false);
      setMoveBrowserFolder(null);
      setMoveFolderHistory([]);
      setMoveFolders([]);
      clearSelection();

      await fetchStarredItems(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to move selected items."
      );
    } finally {
      setMovingItems(false);
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

  // ======================================================
  // EMPTY STATES
  // ======================================================

  const isEmpty =
    !loading &&
    files.length === 0 &&
    folders.length === 0;

  const noMatches =
    !loading &&
    !isEmpty &&
    filteredFiles.length === 0 &&
    filteredFolders.length === 0;

  const totalFilteredItems =
    filteredFiles.length +
    filteredFolders.length;

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-200 lg:p-8 ${
        isDark
          ? "bg-slate-950"
          : "bg-[#F6F8FC]"
      }`}
    >
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-violet-400"
                  : "text-slate-500 hover:bg-white hover:text-violet-600 hover:shadow-sm"
              }`}
              title="Back to My Drive"
            >
              <ArrowLeft
                size={21}
              />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <h1
                  className={`text-3xl font-bold tracking-tight ${
                    isDark
                      ? "text-slate-100"
                      : "text-slate-950"
                  }`}
                >
                  Starred
                </h1>

                <Star
                  size={25}
                  className="fill-amber-400 text-amber-400"
                />
              </div>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Files and folders you marked as important.
              </p>
            </div>
          </div>

          {!loading &&
            !isEmpty && (
              <button
                type="button"
                onClick={() =>
                  fetchStarredItems(true)
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

        {/* TOOLBAR */}

        {!loading &&
          !isEmpty && (
            <div className="mb-6">
              <DriveToolbar
                searchQuery={
                  searchQuery
                }
                onSearchChange={(value) => {
                  setSearchQuery(value);
                  clearSelection();
                }}
                searchPlaceholder="Search starred files and folders..."
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
                onViewModeChange={
                  handleViewModeChange
                }
                isDark={
                  isDark
                }
              />
            </div>
          )}

        {/* SELECTION TOOLBAR */}

        {selectedItems.length > 0 && (
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
              {selectedItems.length} selected
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
              <Sparkles
                size={16}
              />
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
              title="Download selected files"
              isDark={isDark}
              onClick={
                handleDownloadSelected
              }
            >
              <Download
                size={20}
              />
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
              <Trash2
                size={20}
              />
            </ActionButton>

            <ActionButton
              title="Copy link"
              isDark={isDark}
              onClick={
                handleCopyLinks
              }
            >
              <Link2
                size={20}
              />
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
                  className={`absolute right-0 top-12 z-[100] w-60 overflow-hidden rounded-2xl border py-2 shadow-2xl ${
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
                    label="Remove from Starred"
                    onClick={() => {
                      setMoreOpen(false);
                      handleUnstarSelected();
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
                    label="Download files"
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
                      <X
                        size={17}
                      />
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

        {/* RESULT COUNT */}

        {!loading &&
          !isEmpty &&
          !noMatches && (
            <div className="mb-5 flex items-center justify-between">
              <p
                className={`text-xs font-bold uppercase tracking-[0.18em] ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Starred items
              </p>

              <span
                className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium ${
                  isDark
                    ? "bg-slate-800 text-slate-300"
                    : "bg-white text-slate-500 shadow-sm"
                }`}
              >
                {
                  totalFilteredItems
                }
              </span>
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
          <div className="flex min-h-[420px] items-center justify-center">
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
                Loading starred items...
              </p>
            </div>
          </div>
        )}

        {/* COMPLETELY EMPTY */}

        {isEmpty && (
          <div className="flex min-h-[460px] items-center justify-center">
            <div className="text-center">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
                  isDark
                    ? "bg-amber-500/10"
                    : "bg-amber-50"
                }`}
              >
                <Star
                  size={34}
                  className="text-amber-400"
                />
              </div>

              <h2
                className={`mt-5 text-lg font-semibold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-700"
                }`}
              >
                Nothing starred yet
              </h2>

              <p
                className={`mt-2 text-sm ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Star important files and folders to find them quickly here.
              </p>
            </div>
          </div>
        )}

        {/* NO MATCH */}

        {noMatches && (
          <div
            className={`rounded-3xl border px-6 py-16 text-center ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <Star
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
              No matching starred items
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

        {/* SELECTABLE CONTENT */}

        {!loading &&
          !noMatches &&
          !isEmpty && (
            <div
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

              {viewMode === "grid" ? (
                <>
                  {filteredFolders.length > 0 && (
                    <section
                      className={
                        filteredFiles.length > 0
                          ? "mb-12"
                          : ""
                      }
                    >
                      <SectionHeader
                        title="FOLDERS & PROJECTS"
                        count={
                          filteredFolders.length
                        }
                        isDark={
                          isDark
                        }
                      />

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredFolders.map(
                          (folder) => (
                            <StarredFolderCard
                              key={
                                folder.id
                              }
                              folder={
                                folder
                              }
                              isDark={
                                isDark
                              }
                              selected={isSelected(
                                "folder",
                                folder
                              )}
                              onSelect={() =>
                                toggleSelection(
                                  "folder",
                                  folder
                                )
                              }
                              onOpen={
                                handleOpenFolder
                              }
                              onUnstar={
                                handleUnstarFolder
                              }
                            />
                          )
                        )}
                      </div>
                    </section>
                  )}

                  {filteredFiles.length > 0 && (
                    <section>
                      <SectionHeader
                        title="FILES"
                        count={
                          filteredFiles.length
                        }
                        isDark={
                          isDark
                        }
                      />

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredFiles.map(
                          (file) => (
                            <StarredFileCard
                              key={
                                file.id
                              }
                              file={
                                file
                              }
                              isDark={
                                isDark
                              }
                              selected={isSelected(
                                "file",
                                file
                              )}
                              onSelect={() =>
                                toggleSelection(
                                  "file",
                                  file
                                )
                              }
                              onOpen={
                                handleOpenFile
                              }
                              onUnstar={
                                handleUnstarFile
                              }
                            />
                          )
                        )}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div
                  className={`overflow-hidden rounded-2xl border ${
                    isDark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div
                    className={`hidden grid-cols-[40px_minmax(0,1fr)_150px_120px_110px] gap-4 border-b px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] md:grid ${
                      isDark
                        ? "border-slate-800 text-slate-500"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <div />
                    <div>Name</div>
                    <div>Type</div>
                    <div>Size</div>
                    <div className="text-center">
                      Action
                    </div>
                  </div>

                  {filteredFolders.map(
                    (folder) => (
                      <StarredFolderRow
                        key={
                          `folder-${folder.id}`
                        }
                        folder={
                          folder
                        }
                        isDark={
                          isDark
                        }
                        selected={isSelected(
                          "folder",
                          folder
                        )}
                        onSelect={() =>
                          toggleSelection(
                            "folder",
                            folder
                          )
                        }
                        onOpen={
                          handleOpenFolder
                        }
                        onUnstar={
                          handleUnstarFolder
                        }
                      />
                    )
                  )}

                  {filteredFiles.map(
                    (file) => (
                      <StarredFileRow
                        key={
                          `file-${file.id}`
                        }
                        file={
                          file
                        }
                        isDark={
                          isDark
                        }
                        selected={isSelected(
                          "file",
                          file
                        )}
                        onSelect={() =>
                          toggleSelection(
                            "file",
                            file
                          )
                        }
                        onOpen={
                          handleOpenFile
                        }
                        onUnstar={
                          handleUnstarFile
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
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
            movingItems
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
            if (movingItems) {
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
            selectedItems.length
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
// SECTION HEADER
// ======================================================

function SectionHeader({
  title,
  count,
  isDark,
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2
        className={`text-xs font-bold tracking-[0.22em] ${
          isDark
            ? "text-slate-500"
            : "text-slate-400"
        }`}
      >
        {title}
      </h2>

      <span
        className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium ${
          isDark
            ? "bg-slate-800 text-slate-300"
            : "bg-white text-slate-500 shadow-sm"
        }`}
      >
        {count}
      </span>
    </div>
  );
}

// ======================================================
// STARRED FOLDER CARD
// ======================================================

function StarredFolderCard({
  folder,
  isDark,
  selected,
  onSelect,
  onOpen,
  onUnstar,
}) {
  const config =
    getItemTypeConfig(
      folder,
      "folder"
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon =
    config.icon;

  return (
    <div
      data-selectable-starred="true"
      data-selection-key={`folder:${folder.id}`}
      className={`group relative rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
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

      <button
        type="button"
        data-no-marquee="true"
        onClick={() =>
          onOpen(folder)
        }
        className="flex w-full items-center gap-3 text-left"
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon
            size={25}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            title={
              folder.name
            }
            className={`truncate font-semibold ${
              isDark
                ? "text-slate-100"
                : "text-slate-800"
            }`}
          >
            {folder.name}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}
            >
              {config.label}
            </span>

            {folder.sizeBytes !==
              undefined && (
              <span
                className={`text-[11px] ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                {formatFileSize(
                  folder.sizeBytes
                )}
              </span>
            )}
          </div>
        </div>

        <Star
          size={19}
          className="shrink-0 fill-amber-400 text-amber-400"
        />
      </button>

      <div
        className={`mt-4 border-t pt-3 ${
          isDark
            ? "border-slate-800"
            : "border-slate-100"
        }`}
      >
        <button
          type="button"
          data-no-marquee="true"
          onClick={() =>
            onUnstar(folder)
          }
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            isDark
              ? "text-slate-400 hover:bg-amber-500/10 hover:text-amber-300"
              : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"
          }`}
        >
          <Star
            size={14}
            className="fill-current"
          />
          Unstar
        </button>
      </div>
    </div>
  );
}

// ======================================================
// STARRED FILE CARD
// ======================================================

function StarredFileCard({
  file,
  isDark,
  selected,
  onSelect,
  onOpen,
  onUnstar,
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

  const fileType =
    getItemTypeKey(
      file,
      "file"
    );

  const isCloudFile =
    [
      "document",
      "spreadsheet",
      "presentation",
    ].includes(
      fileType
    );

  return (
    <div
      data-selectable-starred="true"
      data-selection-key={`file:${file.id}`}
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

      <button
        type="button"
        data-no-marquee="true"
        onClick={() =>
          onOpen(file)
        }
        className="block w-full text-left"
      >
        <div
          className={`relative m-4 flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${colors.preview}`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${
              isDark
                ? "bg-slate-900/90"
                : "bg-white/95"
            } ${colors.icon}`}
          >
            <Icon
              size={35}
              strokeWidth={1.8}
            />
          </div>

          <span
            className={`absolute bottom-2.5 left-2.5 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] ${colors.badge}`}
          >
            {config.badge}
          </span>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p
                title={
                  displayName
                }
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
                  {isCloudFile
                    ? "Cloud Drive file"
                    : formatFileSize(
                        file.sizeBytes
                      )}
                </span>
              </div>
            </div>

            <Star
              size={18}
              className="shrink-0 fill-amber-400 text-amber-400"
            />
          </div>
        </div>
      </button>

      <div
        className={`mx-4 border-t pb-4 pt-3 ${
          isDark
            ? "border-slate-800"
            : "border-slate-100"
        }`}
      >
        <button
          type="button"
          data-no-marquee="true"
          onClick={() =>
            onUnstar(file)
          }
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            isDark
              ? "text-slate-400 hover:bg-amber-500/10 hover:text-amber-300"
              : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"
          }`}
        >
          <Star
            size={14}
            className="fill-current"
          />
          Unstar
        </button>
      </div>
    </div>
  );
}

// ======================================================
// LIST ROWS
// ======================================================

function StarredFolderRow({
  folder,
  isDark,
  selected,
  onSelect,
  onOpen,
  onUnstar,
}) {
  const config =
    getItemTypeConfig(
      folder,
      "folder"
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon =
    config.icon;

  return (
    <div
      data-selectable-starred="true"
      data-selection-key={`folder:${folder.id}`}
      className={`group grid min-h-[74px] grid-cols-1 items-center gap-3 border-b px-5 py-3 transition last:border-b-0 md:grid-cols-[40px_minmax(0,1fr)_150px_120px_110px] md:gap-4 ${
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
          onOpen(folder)
        }
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon
            size={23}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <p
            title={
              folder.name
            }
            className={`truncate font-semibold ${
              isDark
                ? "text-slate-100"
                : "text-slate-800"
            }`}
          >
            {folder.name}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Starred folder
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
        className={`text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {folder.sizeBytes !== undefined
          ? formatFileSize(
              folder.sizeBytes
            )
          : "—"}
      </div>

      <div className="flex md:justify-center">
        <button
          type="button"
          data-no-marquee="true"
          onClick={() =>
            onUnstar(folder)
          }
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            isDark
              ? "text-amber-300 hover:bg-amber-500/10"
              : "text-amber-600 hover:bg-amber-50"
          }`}
        >
          <Star
            size={15}
            className="fill-current"
          />
          Unstar
        </button>
      </div>
    </div>
  );
}

function StarredFileRow({
  file,
  isDark,
  selected,
  onSelect,
  onOpen,
  onUnstar,
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

  const fileType =
    getItemTypeKey(
      file,
      "file"
    );

  const isCloudFile =
    [
      "document",
      "spreadsheet",
      "presentation",
    ].includes(
      fileType
    );

  return (
    <div
      data-selectable-starred="true"
      data-selection-key={`file:${file.id}`}
      className={`group grid min-h-[74px] grid-cols-1 items-center gap-3 border-b px-5 py-3 transition last:border-b-0 md:grid-cols-[40px_minmax(0,1fr)_150px_120px_110px] md:gap-4 ${
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
            title={
              displayName
            }
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
            Starred file
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
        className={`text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {isCloudFile
          ? "Cloud file"
          : formatFileSize(
              file.sizeBytes
            )}
      </div>

      <div className="flex md:justify-center">
        <button
          type="button"
          data-no-marquee="true"
          onClick={() =>
            onUnstar(file)
          }
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            isDark
              ? "text-amber-300 hover:bg-amber-500/10"
              : "text-amber-600 hover:bg-amber-50"
          }`}
        >
          <Star
            size={15}
            className="fill-current"
          />
          Unstar
        </button>
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
// ACTION / MENU
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
              Move selected items
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
                      {folder.name}
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
                {selectedCount} selected item
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
          placeholder="Ask something about the selected starred items..."
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

export default StarredPage;
