import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FolderOpen,
  FolderPlus,
  Grid2X2,
  Link2,
  List,
  MoreVertical,
  Move,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams
} from "react-router-dom";

import api from "../api/axios";
import DriveDropOverlay from "../components/DriveDropOverlay";

import useDriveDragDrop, {
  extractExternalFiles
} from "../hooks/useDriveDragDrop";

import {
  hasDriveDragPayload,
  hasExternalFiles,
  readDriveDragPayload,
  writeDriveDragPayload
} from "../utils/driveDragData";

import {
  getItemDisplayName,
  getItemTypeConfig,
  getItemTypeKey
} from "../utils/fileTypeConfig";

// ======================================================
// PROJECT DETAILS PAGE
// ======================================================

function ProjectDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { settings } = useOutletContext();

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const selectionAreaRef = useRef(null);
  const dragBaseSelectionRef = useRef([]);

  // ======================================================
  // DARK MODE
  // ======================================================

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;

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

    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  const isDark =
    settings?.theme === "dark" ||
    (settings?.theme === "system" && systemDark);

  // ======================================================
  // PROJECT / CONTENT
  // ======================================================

  const [project, setProject] = useState(
    location.state?.project || null
  );

  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  // ======================================================
  // STATUS
  // ======================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ======================================================
  // VIEW MODE
  // ======================================================

  const [viewMode, setViewMode] = useState(() => {
    return (
      localStorage.getItem("projectDetailsViewMode") ||
      settings?.defaultView ||
      "grid"
    );
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("projectDetailsViewMode", mode);
  };

  // ======================================================
  // CREATE / UPLOAD
  // ======================================================

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadingFolder, setUploadingFolder] = useState(false);

  // ======================================================
  // SELECTION
  // ======================================================

  const [selectedItems, setSelectedItems] = useState([]);
  const [dragSelection, setDragSelection] = useState(null);
  const [bulkMoreOpen, setBulkMoreOpen] = useState(false);

  // ======================================================
  // DRAG / DROP
  // ======================================================

  const [folderDropTargetId, setFolderDropTargetId] = useState(null);
  const [dragMoveCount, setDragMoveCount] = useState(0);

  // ======================================================
  // MOVE
  // ======================================================

  const [moveTarget, setMoveTarget] = useState(null);
  const [moveBrowserFolder, setMoveBrowserFolder] = useState(null);
  const [moveFolderHistory, setMoveFolderHistory] = useState([]);
  const [moveFolders, setMoveFolders] = useState([]);
  const [loadingMoveFolders, setLoadingMoveFolders] = useState(false);
  const [movingItem, setMovingItem] = useState(false);

  // ======================================================
  // GEMINI
  // ======================================================

  const [showGemini, setShowGemini] = useState(false);
  const [geminiQuestion, setGeminiQuestion] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [geminiError, setGeminiError] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  // ======================================================
  // LOAD FOLDER
  // ======================================================

  const loadFolder = useCallback(
    async (
      folderId,
      {
        showLoader = true,
      } = {}
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          `/folders/${folderId}`
        );

        return response.data;
      } catch (err) {
        console.error(
          "Project folder load error:",
          err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return null;
        }

        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "Unable to load project contents."
        );

        return null;
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [navigate]
  );

  // ======================================================
  // LOAD PROJECT ROOT
  // ======================================================

  const loadProject = useCallback(
    async ({
      showLoader = true,
    } = {}) => {
      const data = await loadFolder(projectId, {
        showLoader,
      });

      if (!data) return;

      setProject(data.folder || null);
      setCurrentFolder(null);
      setFolderHistory([]);
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setSelectedItems([]);
    },
    [projectId, loadFolder]
  );

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const targetFolderId =
    currentFolder?.id || projectId;

  // ======================================================
  // SIDEBAR ACTIONS
  // ======================================================

  useEffect(() => {
    const action = location.state?.action;

    if (!action) return;

    setError("");
    setMessage("");

    if (action === "new-folder") {
      setFolderName("");
      setShowFolderModal(true);
    }

    if (action === "upload-file") {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }

    if (action === "upload-folder") {
      setTimeout(() => {
        folderInputRef.current?.click();
      }, 100);
    }

    if (action === "new-project") {
      navigate("/dashboard", {
        state: {
          action: "new-project",
          actionId: Date.now(),
        },
      });

      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: {
        project,
      },
    });
  }, [
    location.state?.action,
    location.state?.actionId,
    location.pathname,
    navigate,
    project,
  ]);

  // ======================================================
  // NAVIGATION
  // ======================================================

  const handleOpenFolder = async (folder) => {
    setError("");
    setMessage("");
    setSelectedItems([]);

    const data = await loadFolder(folder.id);

    if (!data) return;

    setFolderHistory((current) => [
      ...current,
      currentFolder
        ? currentFolder
        : {
            id: projectId,
            name: project?.name || "Project",
            isProjectRoot: true,
          },
    ]);

    setCurrentFolder(data.folder || folder);
    setFolders(data.folders || []);
    setFiles(data.files || []);
  };

  const handleBack = async () => {
    setSelectedItems([]);

    if (folderHistory.length === 0) {
      navigate("/projects");
      return;
    }

    const previous =
      folderHistory[folderHistory.length - 1];

    if (previous.isProjectRoot) {
      await loadProject();
      return;
    }

    const data = await loadFolder(previous.id);

    if (!data) return;

    setFolderHistory((current) =>
      current.slice(0, -1)
    );

    setCurrentFolder(data.folder || previous);
    setFolders(data.folders || []);
    setFiles(data.files || []);
  };

  const handleProjectRoot = async () => {
    setMessage("");
    setError("");
    setSelectedItems([]);
    await loadProject();
  };

  // ======================================================
  // REFRESH
  // ======================================================

  const refreshCurrentLocation = async () => {
    try {
      setRefreshing(true);

      const data = await loadFolder(
        targetFolderId,
        {
          showLoader: false,
        }
      );

      if (!data) return;

      if (targetFolderId === projectId) {
        setProject(data.folder || project);
      } else {
        setCurrentFolder(
          data.folder || currentFolder
        );
      }

      setFolders(data.folders || []);
      setFiles(data.files || []);
      setSelectedItems([]);
    } finally {
      setRefreshing(false);
    }
  };

  // ======================================================
  // CREATE FOLDER
  // ======================================================

  const handleCreateFolder = async (event) => {
    event.preventDefault();

    if (!folderName.trim()) return;

    try {
      setCreatingFolder(true);
      setError("");
      setMessage("");

      await api.post("/folders", {
        name: folderName.trim(),
        parentId: targetFolderId,
      });

      setShowFolderModal(false);
      setFolderName("");
      setMessage(
        "Folder created successfully."
      );

      await refreshCurrentLocation();
    } catch (err) {
      console.error(
        "Create project folder error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to create folder."
      );
    } finally {
      setCreatingFolder(false);
    }
  };

  // ======================================================
  // FILE UPLOAD
  // ======================================================

  const handleFileUpload = async (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) return;

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append(
        "folderId",
        targetFolderId
      );

      await api.post(
        "/files/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setMessage(
        `"${selectedFile.name}" uploaded successfully.`
      );

      window.dispatchEvent(
        new Event(
          "cloud-drive-storage-changed"
        )
      );

      await refreshCurrentLocation();
    } catch (err) {
      console.error(
        "Project file upload error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to upload file."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ======================================================
  // FOLDER UPLOAD
  // ======================================================

  const handleFolderUpload = async (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (selectedFiles.length === 0) return;

    try {
      setUploadingFolder(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      const relativePaths = [];

      selectedFiles.forEach((file) => {
        formData.append("files", file);

        relativePaths.push(
          file.webkitRelativePath ||
            file.name
        );
      });

      formData.append(
        "relativePaths",
        JSON.stringify(relativePaths)
      );

      formData.append(
        "parentFolderId",
        targetFolderId
      );

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

      setMessage(
        "Folder uploaded successfully."
      );

      window.dispatchEvent(
        new Event(
          "cloud-drive-storage-changed"
        )
      );

      await refreshCurrentLocation();
    } catch (err) {
      console.error(
        "Project folder upload error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to upload folder."
      );
    } finally {
      setUploadingFolder(false);

      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    }
  };


  // ======================================================
  // DRAG / DROP
  // ======================================================

  const uploadDroppedEntries = async (
    droppedEntries,
    destinationFolderId = targetFolderId
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
      droppedEntries.some(
        (entry) =>
          String(
            entry.relativePath || ""
          ).includes("/")
      );

    try {
      if (containsFolderStructure) {
        setUploadingFolder(true);

        const formData = new FormData();
        const relativePaths = [];

        droppedEntries.forEach((entry) => {
          if (!entry?.file) return;

          formData.append(
            "files",
            entry.file
          );

          relativePaths.push(
            entry.relativePath ||
              entry.file.name
          );
        });

        formData.append(
          "relativePaths",
          JSON.stringify(relativePaths)
        );

        formData.append(
          "parentFolderId",
          destinationFolderId
        );

        const response = await api.post(
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
          response.data?.uploaded?.files ??
          droppedEntries.length;

        const uploadedFolders =
          response.data?.uploaded?.folders ??
          0;

        setMessage(
          `Drop upload complete. ${uploadedFiles} file${
            uploadedFiles === 1 ? "" : "s"
          } and ${uploadedFolders} folder${
            uploadedFolders === 1 ? "" : "s"
          } added.`
        );
      } else {
        setUploading(true);

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

                formData.append(
                  "folderId",
                  destinationFolderId
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
          results.length - failed.length;

        setMessage(
          `${uploadedCount} dropped file${
            uploadedCount === 1
              ? ""
              : "s"
          } uploaded successfully.`
        );

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

      await refreshCurrentLocation();
    } catch (err) {
      console.error(
        "Project drop upload error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to upload dropped items."
      );
    } finally {
      setUploading(false);
      setUploadingFolder(false);
      setFolderDropTargetId(null);
    }
  };

  const moveDroppedDriveItems = async (
    droppedItems,
    destinationFolderId = targetFolderId
  ) => {
    if (
      !Array.isArray(droppedItems) ||
      droppedItems.length === 0
    ) {
      return;
    }

    const destinationKey =
      String(destinationFolderId);

    const validItems =
      droppedItems.filter((entry) => {
        if (
          entry.resourceType !== "folder"
        ) {
          return true;
        }

        return (
          String(entry.id) !==
          destinationKey
        );
      });

    if (validItems.length === 0) {
      setError(
        "A folder cannot be moved into itself."
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
          validItems.map((entry) => {
            if (
              entry.resourceType ===
              "folder"
            ) {
              return api.patch(
                `/folders/${entry.id}`,
                {
                  parentId:
                    destinationFolderId,
                }
              );
            }

            return api.patch(
              `/files/${entry.id}`,
              {
                folderId:
                  destinationFolderId,
              }
            );
          })
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
            movedCount === 1
              ? ""
              : "s"
          } moved successfully.`
        );
      }

      if (failed.length > 0) {
        const firstFailure =
          results.find(
            (result) =>
              result.status ===
              "rejected"
          );

        setError(
          firstFailure?.reason
            ?.response?.data
            ?.error?.message ||
            firstFailure?.reason
              ?.response?.data
              ?.message ||
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be moved.`
        );
      }

      setSelectedItems([]);
      await refreshCurrentLocation();
    } catch (err) {
      console.error(
        "Project drag move error:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to move the dropped items."
      );
    } finally {
      setDragMoveCount(0);
      setFolderDropTargetId(null);
    }
  };

  const handleExternalDropToCurrentLocation =
    async (entries) => {
      await uploadDroppedEntries(
        entries,
        targetFolderId
      );
    };

  const handleInternalDropToCurrentLocation =
    async (items) => {
      await moveDroppedDriveItems(
        items,
        targetFolderId
      );
    };

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop,
  } = useDriveDragDrop({
    disabled: loading,
    onExternalDrop:
      handleExternalDropToCurrentLocation,
    onInternalDrop:
      handleInternalDropToCurrentLocation,
  });

  const getDraggedRecordsForItem = (
    resourceType,
    item
  ) => {
    const key = getSelectionKey(
      resourceType,
      item
    );

    const itemIsSelected =
      selectedItems.some(
        (selected) =>
          selected.key === key
      );

    if (
      itemIsSelected &&
      selectedItems.length > 0
    ) {
      return selectedItems;
    }

    return [
      {
        key,
        resourceType,
        item,
      },
    ];
  };

  const handleItemDragStart = (
    resourceType,
    item,
    event
  ) => {
    const records =
      getDraggedRecordsForItem(
        resourceType,
        item
      );

    if (
      !isItemSelected(
        resourceType,
        item
      )
    ) {
      setSelectedItems(records);
    }

    writeDriveDragPayload(
      event.dataTransfer,
      records
    );

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed =
        "move";
    }
  };

  const handleItemDragEnd = () => {
    setFolderDropTargetId(null);
  };

  const handleFolderDropEnter = (
    folder,
    event
  ) => {
    const canAccept =
      hasExternalFiles(
        event.dataTransfer
      ) ||
      hasDriveDragPayload(
        event.dataTransfer
      );

    if (!canAccept) return;

    event.preventDefault();
    event.stopPropagation();

    setFolderDropTargetId(
      String(folder.id)
    );
  };

  const handleFolderDropOver = (
    folder,
    event
  ) => {
    const isExternal =
      hasExternalFiles(
        event.dataTransfer
      );

    const isInternal =
      hasDriveDragPayload(
        event.dataTransfer
      );

    if (!isExternal && !isInternal) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setFolderDropTargetId(
      String(folder.id)
    );

    event.dataTransfer.dropEffect =
      isInternal ? "move" : "copy";
  };

  const handleFolderDropLeave = (
    folder,
    event
  ) => {
    event.stopPropagation();

    const currentTarget =
      event.currentTarget;

    const relatedTarget =
      event.relatedTarget;

    if (
      relatedTarget &&
      currentTarget.contains(
        relatedTarget
      )
    ) {
      return;
    }

    if (
      String(folderDropTargetId) ===
      String(folder.id)
    ) {
      setFolderDropTargetId(null);
    }
  };

  const handleDropOnFolder = async (
    folder,
    event
  ) => {
    const internalPayload =
      readDriveDragPayload(
        event.dataTransfer
      );

    const isExternal =
      hasExternalFiles(
        event.dataTransfer
      );

    if (!internalPayload && !isExternal) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setFolderDropTargetId(null);

    if (internalPayload) {
      await moveDroppedDriveItems(
        internalPayload.items,
        folder.id
      );

      return;
    }

    const droppedEntries =
      await extractExternalFiles(
        event.dataTransfer
      );

    await uploadDroppedEntries(
      droppedEntries,
      folder.id
    );
  };

  // ======================================================
  // OPEN FILE
  // ======================================================

  const handleOpenFile = async (file) => {
    try {
      setError("");
      setMessage("");

      const typeKey =
        getItemTypeKey(file, "file");

      if (typeKey === "document") {
        navigate(
          `/documents/${file.id}`,
          {
            state: {
              returnTo:
                `/projects/${projectId}`,
            },
          }
        );

        return;
      }

      if (typeKey === "spreadsheet") {
        navigate(
          `/spreadsheets/${file.id}`,
          {
            state: {
              returnTo:
                `/projects/${projectId}`,
            },
          }
        );

        return;
      }

      if (typeKey === "presentation") {
        navigate(
          `/presentations/${file.id}`,
          {
            state: {
              returnTo:
                `/projects/${projectId}`,
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
    } catch (err) {
      console.error(
        "Open project file error:",
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
  // STAR
  // ======================================================

  const handleToggleFolderStar =
    async (folder) => {
      try {
        const response = await api.patch(
          `/starred/folders/${folder.id}`
        );

        const isStarred =
          response.data?.folder?.isStarred;

        setFolders((current) =>
          current.map((item) =>
            item.id === folder.id
              ? {
                  ...item,
                  isStarred,
                }
              : item
          )
        );
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to update folder star."
        );
      }
    };

  const handleToggleFileStar =
    async (file) => {
      try {
        const response = await api.patch(
          `/starred/files/${file.id}`
        );

        const isStarred =
          response.data?.file?.isStarred;

        setFiles((current) =>
          current.map((item) =>
            item.id === file.id
              ? {
                  ...item,
                  isStarred,
                }
              : item
          )
        );
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to update file star."
        );
      }
    };

  // ======================================================
  // SELECTION HELPERS
  // ======================================================

  const getSelectionKey = (
    resourceType,
    item
  ) => `${resourceType}:${item.id}`;

  const isItemSelected = (
    resourceType,
    item
  ) => {
    const key = getSelectionKey(
      resourceType,
      item
    );

    return selectedItems.some(
      (selected) =>
        selected.key === key
    );
  };

  const handleToggleSelection = (
    resourceType,
    item
  ) => {
    const key = getSelectionKey(
      resourceType,
      item
    );

    setSelectedItems((current) => {
      const exists = current.some(
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

  const handleClearSelection = () => {
    setSelectedItems([]);
    setBulkMoreOpen(false);
  };

  const getSelectionRecordFromKey = (
    key
  ) => {
    if (!key) return null;

    const [resourceType, id] =
      key.split(":");

    if (resourceType === "folder") {
      const item = folders.find(
        (folder) =>
          String(folder.id) ===
          String(id)
      );

      if (!item) return null;

      return {
        key: `folder:${item.id}`,
        resourceType: "folder",
        item,
      };
    }

    const item = files.find(
      (file) =>
        String(file.id) ===
        String(id)
    );

    if (!item) return null;

    return {
      key: `file:${item.id}`,
      resourceType: "file",
      item,
    };
  };

  // ======================================================
  // MARQUEE SELECTION
  // ======================================================

  const handleSelectionPointerDown =
    (event) => {
      if (event.button !== 0) return;

      if (
        event.target.closest(
          "button, input, textarea, select, a, [data-no-marquee='true'], [draggable='true']"
        )
      ) {
        return;
      }

      const container =
        selectionAreaRef.current;

      if (!container) return;

      const rect =
        container.getBoundingClientRect();

      const startX =
        event.clientX - rect.left;

      const startY =
        event.clientY - rect.top;

      dragBaseSelectionRef.current =
        event.ctrlKey || event.metaKey
          ? [...selectedItems]
          : [];

      if (
        !event.ctrlKey &&
        !event.metaKey
      ) {
        setSelectedItems([]);
      }

      setDragSelection({
        pointerId: event.pointerId,
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
        // optional
      }
    };

  const handleSelectionPointerMove =
    (event) => {
      if (!dragSelection) return;

      const container =
        selectionAreaRef.current;

      if (!container) return;

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

      if (!moved) return;

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

      const nodes =
        container.querySelectorAll(
          "[data-selectable-item='true']"
        );

      const hitKeys = [];

      nodes.forEach((node) => {
        const itemRect =
          node.getBoundingClientRect();

        const intersects =
          itemRect.right >= left &&
          itemRect.left <= right &&
          itemRect.bottom >= top &&
          itemRect.top <= bottom;

        if (intersects) {
          const key =
            node.getAttribute(
              "data-selection-key"
            );

          if (key) {
            hitKeys.push(key);
          }
        }
      });

      const merged = new Map();

      dragBaseSelectionRef.current.forEach(
        (record) => {
          merged.set(
            record.key,
            record
          );
        }
      );

      hitKeys.forEach((key) => {
        const record =
          getSelectionRecordFromKey(
            key
          );

        if (record) {
          merged.set(
            record.key,
            record
          );
        }
      });

      setSelectedItems(
        Array.from(merged.values())
      );
    };

  const handleSelectionPointerUp =
    (event) => {
      if (!dragSelection) return;

      try {
        event.currentTarget.releasePointerCapture(
          dragSelection.pointerId
        );
      } catch {
        // optional
      }

      setDragSelection(null);
    };

  // ======================================================
  // DOWNLOAD
  // ======================================================

  const handleDownloadFile =
    async (file) => {
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

      const anchor =
        document.createElement("a");

      anchor.href = fileUrl;
      anchor.download =
        file.name ||
        getItemDisplayName(file) ||
        "download";

      anchor.target = "_blank";
      anchor.rel =
        "noopener noreferrer";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    };

  const handleDownloadSelected =
    async () => {
      try {
        setError("");

        const selectedFiles =
          selectedItems.filter(
            (selected) =>
              selected.resourceType ===
              "file"
          );

        for (const selected of selectedFiles) {
          await handleDownloadFile(
            selected.item
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            "Unable to download selected files."
        );
      }
    };

  // ======================================================
  // SHARE
  // ======================================================

  const handleShareSelected =
    async () => {
      if (selectedItems.length === 0) return;

      const email = window.prompt(
        "Enter the registered user's email:"
      );

      if (!email?.trim()) return;

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

        const successCount =
          results.length -
          failed.length;

        setMessage(
          `${successCount} item${
            successCount === 1 ? "" : "s"
          } shared successfully.`
        );

        if (failed.length > 0) {
          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be shared.`
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
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
      return `${window.location.origin}/dashboard?folder=${item.id}`;
    }

    const typeKey =
      getItemTypeKey(item, "file");

    if (typeKey === "document") {
      return `${window.location.origin}/documents/${item.id}`;
    }

    if (typeKey === "spreadsheet") {
      return `${window.location.origin}/spreadsheets/${item.id}`;
    }

    if (typeKey === "presentation") {
      return `${window.location.origin}/presentations/${item.id}`;
    }

    return `${window.location.origin}/dashboard?file=${item.id}`;
  };

  const handleCopySelectedLink =
    async () => {
      if (selectedItems.length === 0) return;

      try {
        const textToCopy =
          selectedItems
            .map((selected) =>
              buildItemLink(
                selected.resourceType,
                selected.item
              )
            )
            .join("\n");

        await navigator.clipboard.writeText(
          textToCopy
        );

        setMessage(
          selectedItems.length === 1
            ? "Link copied to clipboard."
            : `${selectedItems.length} links copied to clipboard.`
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

  const handleTrashSelected =
    async () => {
      if (selectedItems.length === 0) return;

      const confirmed = window.confirm(
        `Move ${selectedItems.length} selected item${
          selectedItems.length === 1
            ? ""
            : "s"
        } to Trash?`
      );

      if (!confirmed) return;

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

        const successCount =
          results.length -
          failed.length;

        setMessage(
          `${successCount} item${
            successCount === 1 ? "" : "s"
          } moved to Trash.`
        );

        if (failed.length > 0) {
          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be deleted.`
          );
        }

        setSelectedItems([]);
        await refreshCurrentLocation();

        window.dispatchEvent(
          new Event(
            "cloud-drive-storage-changed"
          )
        );
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to delete selected items."
        );
      }
    };

  // ======================================================
  // STAR SELECTED
  // ======================================================

  const handleToggleSelectedStar =
    async () => {
      if (selectedItems.length === 0) return;

      const shouldStar =
        selectedItems.some(
          (selected) =>
            !selected.item?.isStarred
        );

      try {
        const results =
          await Promise.allSettled(
            selectedItems.map(
              async (selected) => {
                const currentStarred =
                  Boolean(
                    selected.item
                      ?.isStarred
                  );

                if (
                  currentStarred ===
                  shouldStar
                ) {
                  return null;
                }

                if (
                  selected.resourceType ===
                  "folder"
                ) {
                  return api.patch(
                    `/starred/folders/${selected.item.id}`
                  );
                }

                return api.patch(
                  `/starred/files/${selected.item.id}`
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
            ? "Selected items added to Starred."
            : "Selected items removed from Starred."
        );

        if (failed.length > 0) {
          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be updated.`
          );
        }

        setSelectedItems([]);
        await refreshCurrentLocation();
      } catch {
        setError(
          "Unable to update Starred status."
        );
      }
    };

  // ======================================================
  // MOVE
  // ======================================================

  const openMoveSelected =
    async () => {
      if (selectedItems.length === 0) return;

      setMoveTarget({
        resourceType: "bulk",
        items: [...selectedItems],
      });

      setMoveBrowserFolder(null);
      setMoveFolderHistory([]);

      try {
        setLoadingMoveFolders(true);

        const response =
          await api.get(
            "/folders/root"
          );

        const selectedFolderIds =
          new Set(
            selectedItems
              .filter(
                (selected) =>
                  selected.resourceType ===
                  "folder"
              )
              .map((selected) =>
                String(
                  selected.item.id
                )
              )
          );

        setMoveFolders(
          (
            response.data?.folders ||
            []
          ).filter(
            (folder) =>
              !selectedFolderIds.has(
                String(folder.id)
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

  const loadMoveFolder = async (
    folder = null
  ) => {
    try {
      setLoadingMoveFolders(true);

      const endpoint =
        folder?.id
          ? `/folders/${folder.id}`
          : "/folders/root";

      const response = await api.get(
        endpoint
      );

      const selectedFolderIds =
        new Set(
          selectedItems
            .filter(
              (selected) =>
                selected.resourceType ===
                "folder"
            )
            .map((selected) =>
              String(
                selected.item.id
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
              String(folderItem.id)
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

  const handleBrowseMoveFolder =
    async (folder) => {
      setMoveFolderHistory(
        (current) => [
          ...current,
          moveBrowserFolder,
        ]
      );

      setMoveBrowserFolder(folder);
      await loadMoveFolder(folder);
    };

  const handleMoveBrowserBack =
    async () => {
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

      setMoveFolderHistory(history);
      setMoveBrowserFolder(
        previous || null
      );

      await loadMoveFolder(
        previous || null
      );
    };

  const handleConfirmMove =
    async () => {
      if (!moveTarget) return;

      try {
        setMovingItem(true);

        const destinationId =
          moveBrowserFolder?.id ||
          null;

        const results =
          await Promise.allSettled(
            moveTarget.items.map(
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

        setMessage(
          `${movedCount} item${
            movedCount === 1 ? "" : "s"
          } moved successfully.`
        );

        if (failed.length > 0) {
          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be moved.`
          );
        }

        setMoveTarget(null);
        setMoveBrowserFolder(null);
        setMoveFolderHistory([]);
        setMoveFolders([]);
        setSelectedItems([]);

        await refreshCurrentLocation();
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to move selected items."
        );
      } finally {
        setMovingItem(false);
      }
    };

  // ======================================================
  // GEMINI
  // ======================================================

  const handleAskGemini =
    async () => {
      const question =
        geminiQuestion.trim();

      if (!question) {
        setGeminiError(
          "Please enter a question."
        );

        return;
      }

      if (selectedItems.length === 0) {
        setGeminiError(
          "Select at least one file or folder."
        );

        return;
      }

      try {
        setGeminiLoading(true);
        setGeminiError("");
        setGeminiResponse("");

        const items =
          selectedItems.map(
            (selected) => ({
              id: selected.item.id,
              resourceType:
                selected.resourceType,
            })
          );

        const response = await api.post(
          "/gemini/ask",
          {
            question,
            items,
          }
        );

        const answer =
          response.data?.answer;

        if (!answer) {
          throw new Error(
            "Gemini did not return an answer."
          );
        }

        setGeminiResponse(answer);
      } catch (err) {
        setGeminiError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            "Unable to get a Gemini response."
        );
      } finally {
        setGeminiLoading(false);
      }
    };

  // ======================================================
  // DERIVED
  // ======================================================

  const currentTitle =
    currentFolder?.name ||
    project?.name ||
    "Project";

  const isEmpty =
    !loading &&
    folders.length === 0 &&
    files.length === 0;

  const selectedHasFiles =
    selectedItems.some(
      (selected) =>
        selected.resourceType ===
        "file"
    );

  const allSelectedStarred =
    selectedItems.length > 0 &&
    selectedItems.every(
      (selected) =>
        selected.item?.isStarred
    );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      {...dropZoneProps}
      className={`relative min-h-screen px-6 py-8 transition-colors duration-200 lg:px-12 lg:py-10 ${
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
          isProcessingDrop ||
          dragMoveCount > 0
        }
        mode={
          isInternalDragActive
            ? "move"
            : "upload"
        }
        title={
          isInternalDragActive
            ? `Move to ${currentTitle}`
            : `Upload to ${currentTitle}`
        }
        description={
          isInternalDragActive
            ? "Drop here to move the selected Cloud Drive items into this location."
            : "Drop files or folders from your computer to upload them here."
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        onChange={
          handleFileUpload
        }
        className="hidden"
      />

      <input
        ref={folderInputRef}
        type="file"
        {...{
          webkitdirectory: "",
          directory: "",
        }}
        multiple
        onChange={
          handleFolderUpload
        }
        className="hidden"
      />

      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="flex flex-wrap items-start justify-between gap-5">

          <div className="flex items-start gap-4">

            <button
              type="button"
              onClick={handleBack}
              className={`mt-1 rounded-xl p-2 transition ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-violet-400"
                  : "text-slate-500 hover:bg-white hover:text-violet-600"
              }`}
              title="Back"
            >
              <ArrowLeft size={22} />
            </button>

            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-violet-500/15 text-violet-400"
                  : "bg-violet-50 text-violet-600"
              }`}
            >
              <FolderOpen size={30} />
            </div>

            <div className="min-w-0">

              <h1
                className={`truncate text-4xl font-bold tracking-tight ${
                  isDark
                    ? "text-slate-100"
                    : "text-slate-950"
                }`}
              >
                {currentTitle}
              </h1>

              <p
                className={`mt-2 text-base ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {currentFolder
                  ? `Inside ${
                      project?.name ||
                      "project"
                    }`
                  : "Project workspace"}
              </p>

            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* GRID / LIST */}

            <ViewToggle
              viewMode={viewMode}
              onChange={
                handleViewModeChange
              }
              isDark={isDark}
            />

            <button
              type="button"
              onClick={() => {
                setFolderName("");
                setShowFolderModal(true);
              }}
              className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition ${
                isDark
                  ? "border-violet-500/30 bg-slate-900 text-violet-300 hover:bg-violet-500/10"
                  : "border-violet-200 bg-white text-violet-600 hover:bg-violet-50"
              }`}
            >
              <FolderPlus size={18} />
              New Folder
            </button>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploading ||
                uploadingFolder
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              <Upload size={18} />

              {uploading
                ? "Uploading..."
                : "Upload File"}
            </button>

            <button
              type="button"
              onClick={
                refreshCurrentLocation
              }
              disabled={refreshing}
              className={`flex h-11 items-center gap-2 rounded-xl border px-4 font-semibold shadow-sm transition disabled:opacity-60 ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-violet-500/50 hover:bg-slate-800 hover:text-violet-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-600"
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

        </div>

        {/* BREADCRUMBS */}

        <div
          className={`mt-6 flex flex-wrap items-center gap-1.5 text-sm ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/projects")
            }
            className="font-medium transition hover:text-violet-500"
          >
            Projects
          </button>

          <ChevronRight size={15} />

          <button
            type="button"
            onClick={
              handleProjectRoot
            }
            className={
              currentFolder
                ? isDark
                  ? "font-medium text-slate-400 transition hover:text-violet-400"
                  : "font-medium text-slate-500 transition hover:text-violet-600"
                : isDark
                  ? "font-semibold text-slate-200"
                  : "font-semibold text-slate-800"
            }
          >
            {project?.name ||
              "Project"}
          </button>

          {folderHistory
            .filter(
              (item) =>
                !item.isProjectRoot
            )
            .map(
              (folder, index) => (
                <div
                  key={`${folder.id}-${index}`}
                  className="flex items-center gap-1.5"
                >
                  <ChevronRight
                    size={15}
                  />

                  <span
                    className={
                      isDark
                        ? "font-medium text-slate-400"
                        : "font-medium text-slate-500"
                    }
                  >
                    {folder.name}
                  </span>
                </div>
              )
            )}

          {currentFolder && (
            <>
              <ChevronRight size={15} />

              <span
                className={
                  isDark
                    ? "font-semibold text-slate-200"
                    : "font-semibold text-slate-800"
                }
              >
                {currentFolder.name}
              </span>
            </>
          )}
        </div>

        {/* MULTI SELECT TOOLBAR */}

        {selectedItems.length > 0 && (
          <div
            className={`relative mt-7 flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border px-4 shadow-sm ${
              isDark
                ? "border-violet-500/30 bg-slate-800 text-slate-200"
                : "border-violet-200 bg-violet-50 text-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={
                handleClearSelection
              }
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isDark
                  ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
              title="Clear selection"
            >
              <X size={22} />
            </button>

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
              disabled={
                !selectedHasFiles
              }
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
                handleCopySelectedLink
              }
            >
              <Link2 size={20} />
            </ActionButton>

            <div className="relative">
              <ActionButton
                title="More actions"
                isDark={isDark}
                onClick={() =>
                  setBulkMoreOpen(
                    (current) =>
                      !current
                  )
                }
              >
                <MoreVertical size={21} />
              </ActionButton>

              {bulkMoreOpen && (
                <div
                  className={`absolute left-0 top-12 z-[90] w-56 overflow-hidden rounded-2xl border py-2 shadow-2xl ${
                    isDark
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setBulkMoreOpen(false);
                      handleToggleSelectedStar();
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      isDark
                        ? "text-slate-200 hover:bg-slate-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Star size={17} />

                    {allSelectedStarred
                      ? "Remove from starred"
                      : "Add to starred"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATUS */}

        {message && (
          <div
            className={`mt-7 rounded-2xl border px-5 py-4 text-sm font-medium ${
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
            className={`mt-7 rounded-2xl border px-5 py-4 text-sm font-medium ${
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
          <div
            className={`mt-10 rounded-3xl border py-24 text-center shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-violet-500"
            />

            <p
              className={`mt-4 text-sm font-medium ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Loading project...
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          isEmpty && (
            <div
              className={`mt-10 rounded-3xl border px-6 py-20 text-center shadow-sm ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <FolderOpen
                size={42}
                className="mx-auto text-violet-400"
              />

              <h2
                className={`mt-5 text-xl font-bold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-800"
                }`}
              >
                This folder is empty
              </h2>

              <p
                className={`mt-2 text-sm ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Upload files or create folders here.
              </p>
            </div>
          )}

        {/* SELECTABLE CONTENT */}

        {!loading &&
          !error &&
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
                <ItemSection
                  title={
                    currentFolder
                      ? "Folders"
                      : "Project folders"
                  }
                  items={folders}
                  resourceType="folder"
                  viewMode={viewMode}
                  isDark={isDark}
                  isSelected={
                    isItemSelected
                  }
                  onToggleSelect={
                    handleToggleSelection
                  }
                  onOpen={
                    handleOpenFolder
                  }
                  onToggleStar={
                    handleToggleFolderStar
                  }
                  onItemDragStart={
                    handleItemDragStart
                  }
                  onItemDragEnd={
                    handleItemDragEnd
                  }
                  dropTargetId={
                    folderDropTargetId
                  }
                  onFolderDragEnter={
                    handleFolderDropEnter
                  }
                  onFolderDragOver={
                    handleFolderDropOver
                  }
                  onFolderDragLeave={
                    handleFolderDropLeave
                  }
                  onFolderDrop={
                    handleDropOnFolder
                  }
                />
              )}

              {files.length > 0 && (
                <ItemSection
                  title="Files"
                  items={files}
                  resourceType="file"
                  viewMode={viewMode}
                  isDark={isDark}
                  isSelected={
                    isItemSelected
                  }
                  onToggleSelect={
                    handleToggleSelection
                  }
                  onOpen={
                    handleOpenFile
                  }
                  onToggleStar={
                    handleToggleFileStar
                  }
                  onItemDragStart={
                    handleItemDragStart
                  }
                  onItemDragEnd={
                    handleItemDragEnd
                  }
                  dropTargetId={
                    folderDropTargetId
                  }
                  onFolderDragEnter={
                    handleFolderDropEnter
                  }
                  onFolderDragOver={
                    handleFolderDropOver
                  }
                  onFolderDragLeave={
                    handleFolderDropLeave
                  }
                  onFolderDrop={
                    handleDropOnFolder
                  }
                />
              )}
            </div>
          )}
      </div>

      {/* CREATE FOLDER MODAL */}

      {showFolderModal && (
        <CreateFolderModal
          folderName={folderName}
          setFolderName={
            setFolderName
          }
          creatingFolder={
            creatingFolder
          }
          currentTitle={
            currentTitle
          }
          isDark={isDark}
          onSubmit={
            handleCreateFolder
          }
          onClose={() => {
            setShowFolderModal(false);
            setFolderName("");
          }}
        />
      )}

      {/* MOVE MODAL */}

      {moveTarget && (
        <MoveModal
          currentFolder={
            moveBrowserFolder
          }
          folders={moveFolders}
          canGoBack={
            Boolean(
              moveBrowserFolder
            ) ||
            moveFolderHistory.length > 0
          }
          loading={
            loadingMoveFolders
          }
          moving={movingItem}
          isDark={isDark}
          onBrowse={
            handleBrowseMoveFolder
          }
          onBack={
            handleMoveBrowserBack
          }
          onMove={
            handleConfirmMove
          }
          onClose={() => {
            if (movingItem) return;

            setMoveTarget(null);
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
          error={geminiError}
          loading={
            geminiLoading
          }
          isDark={isDark}
          onAsk={
            handleAskGemini
          }
          onClose={() => {
            if (geminiLoading) return;

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
// VIEW TOGGLE
// ======================================================

function ViewToggle({
  viewMode,
  onChange,
  isDark,
}) {
  return (
    <div
      className={`flex h-11 items-center rounded-xl border p-1 ${
        isDark
          ? "border-slate-700 bg-slate-900"
          : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          onChange("list")
        }
        className={`flex h-8 w-10 items-center justify-center rounded-lg ${
          viewMode === "list"
            ? isDark
              ? "bg-violet-500/20 text-violet-300"
              : "bg-violet-50 text-violet-600"
            : isDark
              ? "text-slate-500 hover:bg-slate-800"
              : "text-slate-500 hover:bg-slate-50"
        }`}
        title="List view"
      >
        <List size={18} />
      </button>

      <button
        type="button"
        onClick={() =>
          onChange("grid")
        }
        className={`flex h-8 w-10 items-center justify-center rounded-lg ${
          viewMode === "grid"
            ? isDark
              ? "bg-violet-500/20 text-violet-300"
              : "bg-violet-50 text-violet-600"
            : isDark
              ? "text-slate-500 hover:bg-slate-800"
              : "text-slate-500 hover:bg-slate-50"
        }`}
        title="Grid view"
      >
        <Grid2X2 size={18} />
      </button>
    </div>
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
  disabled = false,
  children,
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition disabled:cursor-not-allowed ${
        danger
          ? isDark
            ? "text-slate-300 hover:bg-red-500/15 hover:text-red-300 disabled:text-slate-600"
            : "text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:text-slate-300"
          : isDark
            ? "text-slate-300 hover:bg-slate-700 hover:text-violet-300 disabled:text-slate-600"
            : "text-slate-600 hover:bg-white hover:text-violet-600 disabled:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

// ======================================================
// ITEM SECTION
// ======================================================

function ItemSection({
  title,
  items,
  resourceType,
  viewMode,
  isDark,
  isSelected,
  onToggleSelect,
  onOpen,
  onToggleStar,
  onItemDragStart,
  onItemDragEnd,
  dropTargetId,
  onFolderDragEnter,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between">

        <h2
          className={`text-xs font-bold uppercase tracking-[0.18em] ${
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
          {items.map((item) => (
            <GridItem
              key={item.id}
              item={item}
              resourceType={
                resourceType
              }
              isDark={isDark}
              selected={isSelected(
                resourceType,
                item
              )}
              onToggleSelect={() =>
                onToggleSelect(
                  resourceType,
                  item
                )
              }
              onOpen={onOpen}
              onToggleStar={
                onToggleStar
              }
              onItemDragStart={
                onItemDragStart
              }
              onItemDragEnd={
                onItemDragEnd
              }
              dropTarget={
                resourceType === "folder" &&
                String(dropTargetId) ===
                  String(item.id)
              }
              onFolderDragEnter={
                onFolderDragEnter
              }
              onFolderDragOver={
                onFolderDragOver
              }
              onFolderDragLeave={
                onFolderDragLeave
              }
              onFolderDrop={
                onFolderDrop
              }
            />
          ))}
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-2xl border ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <ListHeader isDark={isDark} />

          {items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              resourceType={
                resourceType
              }
              isDark={isDark}
              selected={isSelected(
                resourceType,
                item
              )}
              onToggleSelect={() =>
                onToggleSelect(
                  resourceType,
                  item
                )
              }
              onOpen={onOpen}
              onToggleStar={
                onToggleStar
              }
              onItemDragStart={
                onItemDragStart
              }
              onItemDragEnd={
                onItemDragEnd
              }
              dropTarget={
                resourceType === "folder" &&
                String(dropTargetId) ===
                  String(item.id)
              }
              onFolderDragEnter={
                onFolderDragEnter
              }
              onFolderDragOver={
                onFolderDragOver
              }
              onFolderDragLeave={
                onFolderDragLeave
              }
              onFolderDrop={
                onFolderDrop
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ======================================================
// GRID ITEM
// ======================================================

function GridItem({
  item,
  resourceType,
  isDark,
  selected,
  onToggleSelect,
  onOpen,
  onToggleStar,
  onItemDragStart,
  onItemDragEnd,
  dropTarget,
  onFolderDragEnter,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}) {
  const config =
    getItemTypeConfig(
      item,
      resourceType
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon = config.icon;

  return (
    <div
      data-selectable-item="true"
      data-selection-key={`${resourceType}:${item.id}`}
      draggable
      onDragStart={(event) =>
        onItemDragStart(
          resourceType,
          item,
          event
        )
      }
      onDragEnd={onItemDragEnd}
      onDragEnter={
        resourceType === "folder"
          ? (event) =>
              onFolderDragEnter(
                item,
                event
              )
          : undefined
      }
      onDragOver={
        resourceType === "folder"
          ? (event) =>
              onFolderDragOver(
                item,
                event
              )
          : undefined
      }
      onDragLeave={
        resourceType === "folder"
          ? (event) =>
              onFolderDragLeave(
                item,
                event
              )
          : undefined
      }
      onDrop={
        resourceType === "folder"
          ? (event) =>
              onFolderDrop(
                item,
                event
              )
          : undefined
      }
      className={`group relative overflow-hidden rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-xl ${
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
          onClick={
            onToggleSelect
          }
        />
      </div>

      <div className="absolute right-3 top-3 z-20">
        <button
          type="button"
          data-no-marquee="true"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar(item);
          }}
          className={`rounded-xl p-2 ${
            isDark
              ? "hover:bg-amber-500/10"
              : "hover:bg-amber-50"
          }`}
        >
          <Star
            size={19}
            className={
              item.isStarred
                ? "fill-amber-400 text-amber-400"
                : isDark
                  ? "text-slate-600"
                  : "text-slate-300"
            }
          />
        </button>
      </div>

      <button
        type="button"
        data-no-marquee="true"
        onClick={() =>
          onOpen(item)
        }
        className="w-full text-left"
      >
        <div
          className={`flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.preview}`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors.iconBox}`}
          >
            <Icon
              size={34}
              strokeWidth={1.8}
            />
          </div>
        </div>

        <h3
          className={`mt-4 truncate font-bold ${
            isDark
              ? "text-slate-100"
              : "text-slate-900"
          }`}
        >
          {getItemDisplayName(item)}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-[0.06em] ${colors.badge}`}
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
            {formatFileSize(
              item.sizeBytes
            )}
          </span>
        </div>
      </button>
    </div>
  );
}

// ======================================================
// LIST HEADER
// ======================================================

function ListHeader({ isDark }) {
  return (
    <div
      className={`grid grid-cols-[40px_minmax(0,1fr)_150px_120px_60px] items-center border-b px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] ${
        isDark
          ? "border-slate-800 text-slate-500"
          : "border-slate-200 text-slate-400"
      }`}
    >
      <span />
      <span>Name</span>
      <span>Type</span>
      <span>Size</span>
      <span />
    </div>
  );
}

// ======================================================
// LIST ITEM
// ======================================================

function ListItem({
  item,
  resourceType,
  isDark,
  selected,
  onToggleSelect,
  onOpen,
  onToggleStar,
  onItemDragStart,
  onItemDragEnd,
  dropTarget,
  onFolderDragEnter,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}) {
  const config =
    getItemTypeConfig(
      item,
      resourceType
    );

  const colors =
    isDark
      ? config.dark
      : config.light;

  const Icon = config.icon;

  return (
    <div
      data-selectable-item="true"
      data-selection-key={`${resourceType}:${item.id}`}
      draggable
      onDragStart={(event) =>
        onItemDragStart(
          resourceType,
          item,
          event
        )
      }
      onDragEnd={onItemDragEnd}
      onDragEnter={
        resourceType === "folder"
          ? (event) =>
              onFolderDragEnter(
                item,
                event
              )
          : undefined
      }
      onDragOver={
        resourceType === "folder"
          ? (event) =>
              onFolderDragOver(
                item,
                event
              )
          : undefined
      }
      onDragLeave={
        resourceType === "folder"
          ? (event) =>
              onFolderDragLeave(
                item,
                event
              )
          : undefined
      }
      onDrop={
        resourceType === "folder"
          ? (event) =>
              onFolderDrop(
                item,
                event
              )
          : undefined
      }
      className={`group grid min-h-[72px] grid-cols-[40px_minmax(0,1fr)_150px_120px_60px] items-center border-b px-5 transition last:border-b-0 ${
        dropTarget
          ? isDark
            ? "border-violet-400 bg-violet-500/20 ring-2 ring-inset ring-violet-400/60"
            : "border-violet-300 bg-violet-100 ring-2 ring-inset ring-violet-300"
          : selected
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
        onClick={
          onToggleSelect
        }
      />

      <button
        type="button"
        data-no-marquee="true"
        onClick={() =>
          onOpen(item)
        }
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <span
          className={`truncate font-semibold ${
            isDark
              ? "text-slate-100"
              : "text-slate-800"
          }`}
        >
          {getItemDisplayName(item)}
        </span>
      </button>

      <span
        className={`text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {config.label}
      </span>

      <span
        className={`text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {formatFileSize(
          item.sizeBytes
        )}
      </span>

      <button
        type="button"
        data-no-marquee="true"
        onClick={(event) => {
          event.stopPropagation();
          onToggleStar(item);
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          isDark
            ? "hover:bg-amber-500/10"
            : "hover:bg-amber-50"
        }`}
      >
        <Star
          size={18}
          className={
            item.isStarred
              ? "fill-amber-400 text-amber-400"
              : isDark
                ? "text-slate-600"
                : "text-slate-300"
          }
        />
      </button>
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
// CREATE FOLDER MODAL
// ======================================================

function CreateFolderModal({
  folderName,
  setFolderName,
  creatingFolder,
  currentTitle,
  isDark,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">

      <div
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2
              className={`text-xl font-bold ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-900"
              }`}
            >
              Create folder
            </h2>

            <p
              className={`mt-1 text-sm ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Create inside{" "}
              <span
                className={
                  isDark
                    ? "font-semibold text-slate-300"
                    : "font-semibold text-slate-600"
                }
              >
                {currentTitle}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl p-2 ${
              isDark
                ? "text-slate-500 hover:bg-slate-800"
                : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={onSubmit}>

          <input
            autoFocus
            value={folderName}
            onChange={(event) =>
              setFolderName(
                event.target.value
              )
            }
            placeholder="Folder name"
            className={`w-full rounded-2xl border px-4 py-3 outline-none ${
              isDark
                ? "border-slate-700 bg-slate-950 text-slate-100 focus:border-violet-500"
                : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-300"
            }`}
          />

          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={
                creatingFolder
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                creatingFolder ||
                !folderName.trim()
              }
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creatingFolder
                ? "Creating..."
                : "Create Folder"}
            </button>

          </div>
        </form>
      </div>
    </div>
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
              folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() =>
                    onBrowse(folder)
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
              ))
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
          placeholder="Ask something about the selected items..."
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

  if (value === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
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

export default ProjectDetailsPage;
