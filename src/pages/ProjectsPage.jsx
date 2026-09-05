import {
  ArrowLeft,
  Check,
  ChevronRight,
  FolderOpen,
  Grid2X2,
  Link2,
  List,
  MoreVertical,
  Move,
  RefreshCw,
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
import DriveDropOverlay from "../components/DriveDropOverlay";
import useDriveDragDrop, {
  extractExternalFiles,
} from "../hooks/useDriveDragDrop";

import {
  hasDriveDragPayload,
  hasExternalFiles,
  readDriveDragPayload,
  writeDriveDragPayload,
} from "../utils/driveDragData";

import {
  getItemTypeConfig,
} from "../utils/fileTypeConfig";

// ======================================================
// HELPERS
// ======================================================

const formatFileSize = (bytes) => {
  const value = Number(bytes) || 0;

  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  const size = value / Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : size < 10 ? 2 : 1
  )} ${units[index]}`;
};

const PROJECT_TYPE_OPTIONS = [
  {
    value: "all",
    label: "All types",
  },
  {
    value: "project",
    label: "Projects",
  },
];

// ======================================================
// PAGE
// ======================================================

function ProjectsPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ======================================================
  // TOOLBAR / VIEW
  // ======================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [viewMode, setViewMode] = useState(() => {
    return (
      localStorage.getItem("projectsViewMode") ||
      settings?.defaultView ||
      "grid"
    );
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("projectsViewMode", mode);
  };

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
  // SELECTION
  // ======================================================

  const [selectedProjects, setSelectedProjects] = useState([]);
  const [dragSelection, setDragSelection] = useState(null);
  const [bulkMoreOpen, setBulkMoreOpen] = useState(false);

  const selectionAreaRef = useRef(null);
  const dragBaseSelectionRef = useRef([]);

  // ======================================================
  // DRAG / DROP
  // ======================================================

  const [projectDropTargetId, setProjectDropTargetId] = useState(null);
  const [dragMoveCount, setDragMoveCount] = useState(0);
  const [dragUploading, setDragUploading] = useState(false);

  const projectHoverOpenTimerRef = useRef(null);
  const hoveredProjectIdRef = useRef(null);

  // ======================================================
  // MOVE
  // ======================================================

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveBrowserFolder, setMoveBrowserFolder] = useState(null);
  const [moveFolderHistory, setMoveFolderHistory] = useState([]);
  const [moveFolders, setMoveFolders] = useState([]);
  const [loadingMoveFolders, setLoadingMoveFolders] = useState(false);
  const [movingProjects, setMovingProjects] = useState(false);


  // ======================================================
  // DRAG / DROP
  // ======================================================

  const refreshProjectsAfterDrop = async () => {
    setSelectedProjects([]);
    await loadProjects(true);
  };

  const uploadDroppedEntries = async (
    droppedEntries,
    destinationFolderId = null
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
        String(entry.relativePath || "").includes("/")
      );

    try {
      setDragUploading(true);

      if (containsFolderStructure) {
        const formData = new FormData();
        const relativePaths = [];

        droppedEntries.forEach((entry) => {
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

        if (destinationFolderId) {
          formData.append(
            "parentFolderId",
            destinationFolderId
          );
        }

        const response = await api.post(
          "/files/upload-folder",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const uploadedFiles =
          response.data?.uploaded?.files ??
          droppedEntries.length;

        const uploadedFolders =
          response.data?.uploaded?.folders ?? 0;

        setMessage(
          `Drop upload complete. ${uploadedFiles} file${
            uploadedFiles === 1 ? "" : "s"
          } and ${uploadedFolders} folder${
            uploadedFolders === 1 ? "" : "s"
          } added.`
        );
      } else {
        const results = await Promise.allSettled(
          droppedEntries.map(async (entry) => {
            if (!entry?.file) {
              throw new Error("Invalid dropped file.");
            }

            const formData = new FormData();

            formData.append(
              "file",
              entry.file
            );

            if (destinationFolderId) {
              formData.append(
                "folderId",
                destinationFolderId
              );
            }

            return api.post(
              "/files/upload",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
          })
        );

        const failed = results.filter(
          (result) => result.status === "rejected"
        );

        const uploadedCount =
          results.length - failed.length;

        setMessage(
          `${uploadedCount} dropped file${
            uploadedCount === 1 ? "" : "s"
          } uploaded successfully.`
        );

        if (failed.length > 0) {
          setError(
            `${failed.length} file${
              failed.length === 1 ? "" : "s"
            } could not be uploaded.`
          );
        }
      }

      window.dispatchEvent(
        new Event("cloud-drive-storage-changed")
      );

      await refreshProjectsAfterDrop();
    } catch (err) {
      console.error("Projects drop upload error:", err);

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to upload dropped items."
      );
    } finally {
      setDragUploading(false);
      setProjectDropTargetId(null);
    }
  };

  const moveDroppedDriveItems = async (
    droppedItems,
    destinationFolderId = null
  ) => {
    if (
      !Array.isArray(droppedItems) ||
      droppedItems.length === 0
    ) {
      return;
    }

    const destinationKey =
      destinationFolderId === null
        ? null
        : String(destinationFolderId);

    const validItems = droppedItems.filter(
      (entry) => {
        if (entry.resourceType !== "folder") {
          return true;
        }

        return String(entry.id) !== destinationKey;
      }
    );

    if (validItems.length === 0) {
      setError(
        "A folder or project cannot be moved into itself."
      );
      return;
    }

    try {
      setDragMoveCount(validItems.length);
      setError("");
      setMessage("");

      const results = await Promise.allSettled(
        validItems.map((entry) => {
          if (entry.resourceType === "folder") {
            return api.patch(
              `/folders/${entry.id}`,
              {
                parentId: destinationFolderId,
              }
            );
          }

          return api.patch(
            `/files/${entry.id}`,
            {
              folderId: destinationFolderId,
            }
          );
        })
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
          } moved successfully.`
        );
      }

      if (failed.length > 0) {
        const firstFailure = results.find(
          (result) => result.status === "rejected"
        );

        setError(
          firstFailure?.reason?.response?.data
            ?.error?.message ||
            firstFailure?.reason?.response?.data
              ?.message ||
            `${failed.length} item${
              failed.length === 1 ? "" : "s"
            } could not be moved.`
        );
      }

      await refreshProjectsAfterDrop();
    } catch (err) {
      console.error("Projects drag move error:", err);

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unable to move the dropped items."
      );
    } finally {
      setDragMoveCount(0);
      setProjectDropTargetId(null);
    }
  };

  const handleExternalDropToProjectsPage =
    async (entries) => {
      // Projects is a virtual collection.
      // Blank-space drops go to My Drive root.
      await uploadDroppedEntries(entries, null);
    };

  const handleInternalDropToProjectsPage =
    async (items) => {
      // Blank-space internal drops move to My Drive root.
      await moveDroppedDriveItems(items, null);
    };

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop,
  } = useDriveDragDrop({
    disabled: loading,
    onExternalDrop:
      handleExternalDropToProjectsPage,
    onInternalDrop:
      handleInternalDropToProjectsPage,
  });

  const getDraggedProjectsForItem =
    (project) => {
      const isSelected =
        selectedProjects.some(
          (selected) =>
            String(selected.id) ===
            String(project.id)
        );

      if (
        isSelected &&
        selectedProjects.length > 0
      ) {
        return selectedProjects.map(
          (selected) => ({
            key: `folder:${selected.id}`,
            resourceType: "folder",
            item: selected,
          })
        );
      }

      return [
        {
          key: `folder:${project.id}`,
          resourceType: "folder",
          item: project,
        },
      ];
    };

  const cancelProjectHoverOpen = () => {
    if (projectHoverOpenTimerRef.current) {
      clearTimeout(projectHoverOpenTimerRef.current);
      projectHoverOpenTimerRef.current = null;
    }

    hoveredProjectIdRef.current = null;
  };

  const scheduleProjectHoverOpen = (project) => {
    const projectId = String(project.id);

    if (
      hoveredProjectIdRef.current === projectId &&
      projectHoverOpenTimerRef.current
    ) {
      return;
    }

    cancelProjectHoverOpen();

    hoveredProjectIdRef.current = projectId;

    projectHoverOpenTimerRef.current = setTimeout(() => {
      projectHoverOpenTimerRef.current = null;

      if (
        hoveredProjectIdRef.current !== projectId
      ) {
        return;
      }

      hoveredProjectIdRef.current = null;
      setProjectDropTargetId(null);

      navigate(`/projects/${project.id}`, {
        state: {
          project,
          openedByDragHover: true,
        },
      });
    }, 700);
  };

  const handleProjectDragStart =
    (project, event) => {
      const records =
        getDraggedProjectsForItem(project);

      if (!isProjectSelected(project)) {
        setSelectedProjects([project]);
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

  const handleProjectDragEnd = () => {
    cancelProjectHoverOpen();
    setProjectDropTargetId(null);
  };

  const handleProjectDropEnter =
    (project, event) => {
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

      setProjectDropTargetId(
        String(project.id)
      );

      scheduleProjectHoverOpen(project);
    };

  const handleProjectDropOver =
    (project, event) => {
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

      setProjectDropTargetId(
        String(project.id)
      );

      scheduleProjectHoverOpen(project);

      event.dataTransfer.dropEffect =
        isInternal ? "move" : "copy";
    };

  const handleProjectDropLeave =
    (project, event) => {
      event.stopPropagation();

      const relatedTarget =
        event.relatedTarget;

      if (
        relatedTarget &&
        event.currentTarget.contains(
          relatedTarget
        )
      ) {
        return;
      }

      if (
        String(projectDropTargetId) ===
        String(project.id)
      ) {
        setProjectDropTargetId(null);
      }

      if (
        hoveredProjectIdRef.current ===
        String(project.id)
      ) {
        cancelProjectHoverOpen();
      }
    };

  const handleDropOnProject =
    async (project, event) => {
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

      cancelProjectHoverOpen();
      setProjectDropTargetId(null);

      if (internalPayload) {
        await moveDroppedDriveItems(
          internalPayload.items,
          project.id
        );

        return;
      }

      const droppedEntries =
        await extractExternalFiles(
          event.dataTransfer
        );

      await uploadDroppedEntries(
        droppedEntries,
        project.id
      );
    };

  useEffect(() => {
    return () => {
      if (projectHoverOpenTimerRef.current) {
        clearTimeout(projectHoverOpenTimerRef.current);
      }
    };
  }, []);

  // ======================================================
  // GEMINI
  // ======================================================

  const [showGemini, setShowGemini] = useState(false);
  const [geminiQuestion, setGeminiQuestion] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [geminiError, setGeminiError] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  // ======================================================
  // LOAD PROJECTS
  // ======================================================

  const loadProjects = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          "/folders/projects"
        );

        setProjects(response.data?.projects || []);
      } catch (err) {
        console.error("Projects load error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "Unable to load projects."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ======================================================
  // SEARCH / FILTER
  // ======================================================

  const filteredProjects = useMemo(() => {
    const normalizedQuery =
      searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedQuery ||
        String(project.name || "")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesType =
        typeFilter === "all" ||
        typeFilter === "project";

      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, typeFilter]);

  // ======================================================
  // OPEN / STAR
  // ======================================================

  const handleOpenProject = (project) => {
    setSelectedProjects([]);

    navigate(`/projects/${project.id}`, {
      state: {
        project,
      },
    });
  };

  const handleToggleProjectStar = async (project) => {
    try {
      setError("");

      const response = await api.patch(
        `/starred/folders/${project.id}`
      );

      const isStarred =
        response.data?.folder?.isStarred;

      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? {
                ...item,
                isStarred,
              }
            : item
        )
      );

      setSelectedProjects((current) =>
        current.map((item) =>
          item.id === project.id
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
          "Unable to update project star."
      );
    }
  };

  // ======================================================
  // SELECTION
  // ======================================================

  const isProjectSelected = (project) =>
    selectedProjects.some(
      (selected) =>
        String(selected.id) === String(project.id)
    );

  const handleToggleSelection = (project) => {
    setSelectedProjects((current) => {
      const exists = current.some(
        (selected) =>
          String(selected.id) === String(project.id)
      );

      if (exists) {
        return current.filter(
          (selected) =>
            String(selected.id) !== String(project.id)
        );
      }

      return [...current, project];
    });
  };

  const handleClearSelection = () => {
    setSelectedProjects([]);
    setBulkMoreOpen(false);
  };

  // ======================================================
  // MARQUEE
  // ======================================================

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
        ? [...selectedProjects]
        : [];

    if (!event.ctrlKey && !event.metaKey) {
      setSelectedProjects([]);
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
      moved,
    };

    setDragSelection(next);

    if (!moved) return;

    const left =
      Math.min(next.startX, currentX) + rect.left;

    const right =
      Math.max(next.startX, currentX) + rect.left;

    const top =
      Math.min(next.startY, currentY) + rect.top;

    const bottom =
      Math.max(next.startY, currentY) + rect.top;

    const merged = new Map(
      dragBaseSelectionRef.current.map((project) => [
        String(project.id),
        project,
      ])
    );

    container
      .querySelectorAll("[data-selectable-project='true']")
      .forEach((node) => {
        const itemRect = node.getBoundingClientRect();

        const intersects =
          itemRect.right >= left &&
          itemRect.left <= right &&
          itemRect.bottom >= top &&
          itemRect.top <= bottom;

        if (!intersects) return;

        const id = node.getAttribute("data-project-id");

        const project = filteredProjects.find(
          (item) => String(item.id) === String(id)
        );

        if (project) {
          merged.set(String(project.id), project);
        }
      });

    setSelectedProjects(
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
      // optional
    }

    setDragSelection(null);
  };

  // ======================================================
  // SHARE SELECTED
  // ======================================================

  const handleShareSelected = async () => {
    if (selectedProjects.length === 0) return;

    const email = window.prompt(
      "Enter the registered user's email:"
    );

    if (!email?.trim()) return;

    const permissionInput = window.prompt(
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

      const results = await Promise.allSettled(
        selectedProjects.map((project) =>
          api.post("/shares", {
            email: email.trim().toLowerCase(),
            permission,
            folderId: project.id,
          })
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      const successCount =
        results.length - failed.length;

      setMessage(
        `${successCount} project${
          successCount === 1 ? "" : "s"
        } shared successfully.`
      );

      if (failed.length > 0) {
        setError(
          `${failed.length} project${
            failed.length === 1 ? "" : "s"
          } could not be shared.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to share selected projects."
      );
    }
  };

  // ======================================================
  // COPY LINKS
  // ======================================================

  const handleCopySelectedLinks = async () => {
    if (selectedProjects.length === 0) return;

    try {
      const links = selectedProjects
        .map(
          (project) =>
            `${window.location.origin}/projects/${project.id}`
        )
        .join("\n");

      await navigator.clipboard.writeText(links);

      setMessage(
        selectedProjects.length === 1
          ? "Project link copied."
          : `${selectedProjects.length} project links copied.`
      );
    } catch {
      setError(
        "Unable to copy project links."
      );
    }
  };

  // ======================================================
  // TRASH
  // ======================================================

  const handleTrashSelected = async () => {
    if (selectedProjects.length === 0) return;

    const confirmed = window.confirm(
      `Move ${selectedProjects.length} selected project${
        selectedProjects.length === 1 ? "" : "s"
      } to Trash?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const results = await Promise.allSettled(
        selectedProjects.map((project) =>
          api.delete(`/folders/${project.id}`)
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      const successCount =
        results.length - failed.length;

      setMessage(
        `${successCount} project${
          successCount === 1 ? "" : "s"
        } moved to Trash.`
      );

      if (failed.length > 0) {
        setError(
          `${failed.length} project${
            failed.length === 1 ? "" : "s"
          } could not be deleted.`
        );
      }

      setSelectedProjects([]);
      await loadProjects(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to delete selected projects."
      );
    }
  };

  // ======================================================
  // STAR SELECTED
  // ======================================================

  const handleToggleSelectedStar = async () => {
    if (selectedProjects.length === 0) return;

    const shouldStar = selectedProjects.some(
      (project) => !project.isStarred
    );

    try {
      const results = await Promise.allSettled(
        selectedProjects.map(async (project) => {
          if (
            Boolean(project.isStarred) === shouldStar
          ) {
            return null;
          }

          return api.patch(
            `/starred/folders/${project.id}`
          );
        })
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      setMessage(
        shouldStar
          ? "Selected projects added to Starred."
          : "Selected projects removed from Starred."
      );

      if (failed.length > 0) {
        setError(
          `${failed.length} project${
            failed.length === 1 ? "" : "s"
          } could not be updated.`
        );
      }

      setSelectedProjects([]);
      await loadProjects(true);
    } catch {
      setError(
        "Unable to update Starred status."
      );
    }
  };

  // ======================================================
  // MOVE
  // ======================================================

  const openMoveSelected = async () => {
    if (selectedProjects.length === 0) return;

    setShowMoveModal(true);
    setMoveBrowserFolder(null);
    setMoveFolderHistory([]);

    try {
      setLoadingMoveFolders(true);

      const response = await api.get(
        "/folders/root"
      );

      const selectedIds = new Set(
        selectedProjects.map((project) =>
          String(project.id)
        )
      );

      setMoveFolders(
        (response.data?.folders || []).filter(
          (folder) =>
            !selectedIds.has(String(folder.id))
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

  const loadMoveFolder = async (folder = null) => {
    try {
      setLoadingMoveFolders(true);

      const endpoint =
        folder?.id
          ? `/folders/${folder.id}`
          : "/folders/root";

      const response = await api.get(endpoint);

      const selectedIds = new Set(
        selectedProjects.map((project) =>
          String(project.id)
        )
      );

      setMoveFolders(
        (response.data?.folders || []).filter(
          (folderItem) =>
            !selectedIds.has(
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

  const handleBrowseMoveFolder = async (folder) => {
    setMoveFolderHistory((current) => [
      ...current,
      moveBrowserFolder,
    ]);

    setMoveBrowserFolder(folder);

    await loadMoveFolder(folder);
  };

  const handleMoveBack = async () => {
    if (moveFolderHistory.length === 0) {
      setMoveBrowserFolder(null);
      await loadMoveFolder(null);
      return;
    }

    const history = [...moveFolderHistory];
    const previous = history.pop();

    setMoveFolderHistory(history);
    setMoveBrowserFolder(previous || null);

    await loadMoveFolder(previous || null);
  };

  const handleConfirmMove = async () => {
    try {
      setMovingProjects(true);

      const destinationId =
        moveBrowserFolder?.id || null;

      const results = await Promise.allSettled(
        selectedProjects.map((project) =>
          api.patch(`/folders/${project.id}`, {
            parentId: destinationId,
          })
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      const successCount =
        results.length - failed.length;

      setMessage(
        `${successCount} project${
          successCount === 1 ? "" : "s"
        } moved successfully.`
      );

      if (failed.length > 0) {
        setError(
          `${failed.length} project${
            failed.length === 1 ? "" : "s"
          } could not be moved.`
        );
      }

      setShowMoveModal(false);
      setMoveBrowserFolder(null);
      setMoveFolderHistory([]);
      setMoveFolders([]);
      setSelectedProjects([]);

      await loadProjects(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to move selected projects."
      );
    } finally {
      setMovingProjects(false);
    }
  };

  // ======================================================
  // GEMINI
  // ======================================================

  const handleAskGemini = async () => {
    const question = geminiQuestion.trim();

    if (!question) {
      setGeminiError(
        "Please enter a question."
      );

      return;
    }

    if (selectedProjects.length === 0) {
      setGeminiError(
        "Select at least one project."
      );

      return;
    }

    try {
      setGeminiLoading(true);
      setGeminiError("");
      setGeminiResponse("");

      const response = await api.post(
        "/gemini/ask",
        {
          question,
          items: selectedProjects.map(
            (project) => ({
              id: project.id,
              resourceType: "folder",
            })
          ),
        }
      );

      const answer = response.data?.answer;

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

  const allSelectedStarred =
    selectedProjects.length > 0 &&
    selectedProjects.every(
      (project) => project.isStarred
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
          !projectDropTargetId &&
          (
            isExternalDragActive ||
            isInternalDragActive
          )
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
        description="Drop on a project card to place the items directly inside that project."
      />

      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="flex flex-wrap items-start justify-between gap-5">

          <div className="flex items-start gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-violet-400"
                  : "text-slate-500 hover:bg-white hover:text-violet-600 hover:shadow-sm"
              }`}
              title="Back to My Drive"
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

            <div>
              <h1
                className={`text-4xl font-bold tracking-tight ${
                  isDark
                    ? "text-slate-100"
                    : "text-slate-950"
                }`}
              >
                Projects
              </h1>

              <p
                className={`mt-2 text-base ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Organized workspaces for your important work.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              loadProjects(true)
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

        {/* SEARCH / FILTER / VIEW */}

        <div className="mt-8">
          <DriveToolbar
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setSelectedProjects([]);
            }}
            searchPlaceholder="Search projects..."
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => {
              setTypeFilter(value);
              setSelectedProjects([]);
            }}
            typeOptions={PROJECT_TYPE_OPTIONS}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isDark={isDark}
          />
        </div>

        {/* MULTI SELECT TOOLBAR */}

        {selectedProjects.length > 0 && (
          <div
            className={`relative mt-5 flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border px-4 shadow-sm ${
              isDark
                ? "border-violet-500/30 bg-slate-800 text-slate-200"
                : "border-violet-200 bg-violet-50 text-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={handleClearSelection}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isDark
                  ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <X size={22} />
            </button>

            <span className="min-w-[105px] text-[15px] font-semibold">
              {selectedProjects.length} selected
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
              onClick={handleShareSelected}
            >
              <Users size={20} />
            </ActionButton>

            <ActionButton
              title="Move"
              isDark={isDark}
              onClick={openMoveSelected}
            >
              <Move size={20} />
            </ActionButton>

            <ActionButton
              title="Move to Trash"
              isDark={isDark}
              danger
              onClick={handleTrashSelected}
            >
              <Trash2 size={20} />
            </ActionButton>

            <ActionButton
              title="Copy link"
              isDark={isDark}
              onClick={handleCopySelectedLinks}
            >
              <Link2 size={20} />
            </ActionButton>

            <div className="relative">
              <ActionButton
                title="More actions"
                isDark={isDark}
                onClick={() =>
                  setBulkMoreOpen(
                    (current) => !current
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
              Loading projects...
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <EmptyProjects isDark={isDark} />
          )}

        {!loading &&
          !error &&
          projects.length > 0 &&
          filteredProjects.length === 0 && (
            <div
              className={`mt-10 rounded-3xl border px-6 py-16 text-center ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p
                className={`text-lg font-bold ${
                  isDark
                    ? "text-slate-200"
                    : "text-slate-800"
                }`}
              >
                No matching projects
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredProjects.length > 0 && (
            <section
              ref={selectionAreaRef}
              onPointerDown={handleSelectionPointerDown}
              onPointerMove={handleSelectionPointerMove}
              onPointerUp={handleSelectionPointerUp}
              onPointerCancel={handleSelectionPointerUp}
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
                  Project workspaces
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-white text-slate-500 shadow-sm"
                  }`}
                >
                  {filteredProjects.length}
                </span>

              </div>

              {viewMode === "grid" ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredProjects.map((project) => (
                    <ProjectGridCard
                      key={project.id}
                      project={project}
                      isDark={isDark}
                      selected={
                        isProjectSelected(project)
                      }
                      onToggleSelect={() =>
                        handleToggleSelection(project)
                      }
                      onOpen={handleOpenProject}
                      onToggleStar={
                        handleToggleProjectStar
                      }
                      dropTarget={
                        String(projectDropTargetId) ===
                        String(project.id)
                      }
                      onDragStart={handleProjectDragStart}
                      onDragEnd={handleProjectDragEnd}
                      onDragEnter={handleProjectDropEnter}
                      onDragOver={handleProjectDropOver}
                      onDragLeave={handleProjectDropLeave}
                      onDrop={handleDropOnProject}
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
                  {filteredProjects.map((project) => (
                    <ProjectListRow
                      key={project.id}
                      project={project}
                      isDark={isDark}
                      selected={
                        isProjectSelected(project)
                      }
                      onToggleSelect={() =>
                        handleToggleSelection(project)
                      }
                      onOpen={handleOpenProject}
                      onToggleStar={
                        handleToggleProjectStar
                      }
                      dropTarget={
                        String(projectDropTargetId) ===
                        String(project.id)
                      }
                      onDragStart={handleProjectDragStart}
                      onDragEnd={handleProjectDragEnd}
                      onDragEnter={handleProjectDropEnter}
                      onDragOver={handleProjectDropOver}
                      onDragLeave={handleProjectDropLeave}
                      onDrop={handleDropOnProject}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
      </div>

      {showMoveModal && (
        <MoveModal
          currentFolder={moveBrowserFolder}
          folders={moveFolders}
          canGoBack={
            Boolean(moveBrowserFolder) ||
            moveFolderHistory.length > 0
          }
          loading={loadingMoveFolders}
          moving={movingProjects}
          isDark={isDark}
          onBrowse={handleBrowseMoveFolder}
          onBack={handleMoveBack}
          onMove={handleConfirmMove}
          onClose={() => {
            if (movingProjects) return;

            setShowMoveModal(false);
            setMoveBrowserFolder(null);
            setMoveFolderHistory([]);
            setMoveFolders([]);
          }}
        />
      )}

      {showGemini && (
        <GeminiModal
          selectedCount={selectedProjects.length}
          question={geminiQuestion}
          setQuestion={setGeminiQuestion}
          response={geminiResponse}
          error={geminiError}
          loading={geminiLoading}
          isDark={isDark}
          onAsk={handleAskGemini}
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
// EMPTY
// ======================================================

function EmptyProjects({ isDark }) {
  return (
    <div
      className={`mt-10 rounded-3xl border px-6 py-20 text-center shadow-sm ${
        isDark
          ? "border-slate-800 bg-slate-900"
          : "border-slate-200 bg-white"
      }`}
    >
      <FolderOpen
        size={40}
        className="mx-auto text-violet-400"
      />

      <h2
        className={`mt-6 text-xl font-bold ${
          isDark
            ? "text-slate-200"
            : "text-slate-800"
        }`}
      >
        No projects yet
      </h2>
    </div>
  );
}

// ======================================================
// GRID CARD
// ======================================================

function ProjectGridCard({
  project,
  isDark,
  selected,
  onToggleSelect,
  onOpen,
  onToggleStar,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const config = getItemTypeConfig(
    {
      ...project,
      isProject: true,
    },
    "folder"
  );

  const colors = isDark
    ? config.dark
    : config.light;

  const Icon = config.icon;

  return (
    <div
      data-selectable-project="true"
      data-project-id={project.id}
      draggable
      onDragStart={(event) =>
        onDragStart(project, event)
      }
      onDragEnd={onDragEnd}
      onDragEnter={(event) =>
        onDragEnter(project, event)
      }
      onDragOver={(event) =>
        onDragOver(project, event)
      }
      onDragLeave={(event) =>
        onDragLeave(project, event)
      }
      onDrop={(event) =>
        onDrop(project, event)
      }
      className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        dropTarget
          ? isDark
            ? "border-violet-300 bg-violet-500/20 ring-4 ring-violet-500/30"
            : "border-violet-500 bg-violet-100 ring-4 ring-violet-200"
          : selected
            ? isDark
              ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25"
              : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
            : isDark
              ? `bg-slate-900 shadow-black/20 ${colors.border}`
              : `bg-white shadow-sm ${colors.border}`
      }`}
    >
      <div className="absolute left-3 top-3 z-20">
        <SelectionCheckbox
          selected={selected}
          isDark={isDark}
          onClick={onToggleSelect}
        />
      </div>

      <div className="flex items-start gap-4">

        <button
          type="button"
          data-no-marquee="true"
          onClick={() =>
            onOpen(project)
          }
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
        >
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colors.iconBox}`}
          >
            <Icon size={28} />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={`truncate text-lg font-bold ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-900"
              }`}
            >
              {project.name}
            </h3>

            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${colors.badge}`}
            >
              PROJECT
            </span>
          </div>
        </button>

        <button
          type="button"
          data-no-marquee="true"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar(project);
          }}
          className={
            isDark
              ? "rounded-xl p-2 hover:bg-amber-500/10"
              : "rounded-xl p-2 hover:bg-amber-50"
          }
        >
          <Star
            size={20}
            className={
              project.isStarred
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
          onOpen(project)
        }
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          isDark
            ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
            : "border-violet-200 bg-violet-50 text-violet-700"
        }`}
      >
        <FolderOpen size={17} />
        Open Project
      </button>
    </div>
  );
}

// ======================================================
// LIST ROW
// ======================================================

function ProjectListRow({
  project,
  isDark,
  selected,
  onToggleSelect,
  onOpen,
  onToggleStar,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const config = getItemTypeConfig(
    {
      ...project,
      isProject: true,
    },
    "folder"
  );

  const colors = isDark
    ? config.dark
    : config.light;

  const Icon = config.icon;

  return (
    <div
      data-selectable-project="true"
      data-project-id={project.id}
      draggable
      onDragStart={(event) =>
        onDragStart(project, event)
      }
      onDragEnd={onDragEnd}
      onDragEnter={(event) =>
        onDragEnter(project, event)
      }
      onDragOver={(event) =>
        onDragOver(project, event)
      }
      onDragLeave={(event) =>
        onDragLeave(project, event)
      }
      onDrop={(event) =>
        onDrop(project, event)
      }
      className={`group grid min-h-[76px] grid-cols-[40px_minmax(0,1fr)_140px_70px_150px] items-center gap-4 border-b px-5 transition last:border-b-0 ${
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
        onClick={onToggleSelect}
      />

      <button
        type="button"
        data-no-marquee="true"
        onClick={() =>
          onOpen(project)
        }
        className="flex min-w-0 items-center gap-4 text-left"
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon size={23} />
        </div>

        <span
          className={`truncate font-semibold ${
            isDark
              ? "text-slate-100"
              : "text-slate-800"
          }`}
        >
          {project.name}
        </span>
      </button>

      <span
        className={
          isDark
            ? "text-sm text-slate-400"
            : "text-sm text-slate-500"
        }
      >
        Project
      </span>

      <button
        type="button"
        data-no-marquee="true"
        onClick={(event) => {
          event.stopPropagation();
          onToggleStar(project);
        }}
        className="flex h-10 w-10 items-center justify-center"
      >
        <Star
          size={20}
          className={
            project.isStarred
              ? "fill-amber-400 text-amber-400"
              : isDark
                ? "text-slate-600"
                : "text-slate-300"
          }
        />
      </button>

      <button
        type="button"
        data-no-marquee="true"
        onClick={() =>
          onOpen(project)
        }
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
          isDark
            ? "bg-violet-500/10 text-violet-300"
            : "bg-violet-50 text-violet-700"
        }`}
      >
        <FolderOpen size={16} />
        Open
      </button>
    </div>
  );
}

// ======================================================
// CHECKBOX
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
      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
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
              Move selected projects
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
            onClick={onClose}
            disabled={moving}
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
                    ? "border-slate-700 text-slate-400"
                    : "border-slate-200 text-slate-500"
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
              <div className="flex min-h-[220px] items-center justify-center">
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
              onClick={onClose}
              disabled={moving}
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
              onClick={onMove}
              disabled={moving || loading}
              className="flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {moving ? (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Move size={17} />
              )}

              {moving
                ? "Moving..."
                : "Move here"}
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
                {selectedCount} selected project
                {selectedCount === 1 ? "" : "s"}
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
            setQuestion(event.target.value)
          }
          rows={4}
          placeholder="Ask something about the selected projects..."
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
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw
                size={16}
                className="animate-spin"
              />
            ) : (
              <Sparkles size={16} />
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

export default ProjectsPage;
