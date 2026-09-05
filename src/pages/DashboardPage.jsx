import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FilePlus2,
  FileText,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileVideo,
  Folder,
  FolderKanban,
  FolderPlus,
  Grid2X2,
  Info,
  Link2,
  List,
  LogOut,
  Mail,
  MoreVertical,
  Move,
  Pencil,
  Presentation,
  RefreshCw,
  Search,
  Share2,
  Sheet,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import api from "../api/axios";
import FilePreviewThumbnail from "../components/FilePreviewThumbnail";
import PdfPreviewThumbnail from "../components/PdfPreviewThumbnail";
import MediaPreviewThumbnail from "../components/MediaPreviewThumbnail";
import OfficeFilePreviewCard from "../components/OfficeFilePreviewCard";
import DrivePreviewModal from "../components/DrivePreviewModal";

import TemplateGalleryModal from "../components/templates/TemplateGalleryModal";
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

// ======================================================
// DASHBOARD
// ======================================================

function DashboardPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
  settings,
  updateSetting,
} = useOutletContext();

  // ======================================================
  // DARK MODE
  // ======================================================

  const [
    systemDark,
    setSystemDark,
  ] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
  });

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
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

  const fileInputRef =
    useRef(null);

  const folderInputRef =
    useRef(null);

  // ======================================================
  // DRIVE STATE
  // ======================================================

  const [
    folders,
    setFolders,
  ] = useState([]);

  const [
    files,
    setFiles,
  ] = useState([]);

  const [
    currentFolder,
    setCurrentFolder,
  ] = useState(null);

  const [
    folderHistory,
    setFolderHistory,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  // ======================================================
  // VIEW MODE
  // ======================================================

  // ======================================================
// VIEW MODE
// ======================================================

const viewMode =
  settings?.defaultView ||
  "grid";

const setViewMode =
  (mode) => {
    updateSetting(
      "defaultView",
      mode
    );
  };

  // ======================================================
  // DETAILS
  // ======================================================

  const [
    detailsTarget,
    setDetailsTarget,
  ] = useState(null);

  // ======================================================
  // FILE PREVIEW
  // ======================================================

  const [
    previewFile,
    setPreviewFile,
  ] = useState(null);

  // ======================================================
  // MULTI SELECT / BULK ACTIONS
  // ======================================================

  const [
    selectedItems,
    setSelectedItems,
  ] = useState([]);

  const [
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
  ] = useState(false);

  const [
    bulkDeleting,
    setBulkDeleting,
  ] = useState(false);


  const selectionAreaRef =
    useRef(null);

  const dragBaseSelectionRef =
    useRef([]);

  const [
    dragSelection,
    setDragSelection,
  ] = useState(null);

  const [
    bulkMoreOpen,
    setBulkMoreOpen,
  ] = useState(false);


  const [
    showBulkShareModal,
    setShowBulkShareModal,
  ] = useState(false);

  const [
    bulkShareEmail,
    setBulkShareEmail,
  ] = useState("");

  const [
    bulkSharePermission,
    setBulkSharePermission,
  ] = useState("viewer");

  const [
    bulkSharing,
    setBulkSharing,
  ] = useState(false);


  const [
    showGeminiInfo,
    setShowGeminiInfo,
  ] = useState(false);

  const [geminiQuestion, setGeminiQuestion] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState("");

  // ======================================================
  // MOVE ITEM
  // ======================================================

  const [
    moveTarget,
    setMoveTarget,
  ] = useState(null);

  const [
    moveBrowserFolder,
    setMoveBrowserFolder,
  ] = useState(null);

  const [
    moveFolderHistory,
    setMoveFolderHistory,
  ] = useState([]);

  const [
    moveFolders,
    setMoveFolders,
  ] = useState([]);

  const [
    loadingMoveFolders,
    setLoadingMoveFolders,
  ] = useState(false);

  const [
    movingItem,
    setMovingItem,
  ] = useState(false);

  // ======================================================
  // CREATE FOLDER
  // ======================================================

  const [
    showFolderModal,
    setShowFolderModal,
  ] = useState(false);

  const [
    folderName,
    setFolderName,
  ] = useState("");

  const [
    creatingFolder,
    setCreatingFolder,
  ] = useState(false);

  // ======================================================
  // CREATE PROJECT
  // ======================================================

  const [
    showProjectModal,
    setShowProjectModal,
  ] = useState(false);

  const [
    projectName,
    setProjectName,
  ] = useState("");

  const [
    creatingProject,
    setCreatingProject,
  ] = useState(false);

  // ======================================================
  // CREATE DOCUMENT
  // ======================================================

  const [
    showDocumentModal,
    setShowDocumentModal,
  ] = useState(false);

  const [
    documentName,
    setDocumentName,
  ] = useState("");

  const [
    creatingDocument,
    setCreatingDocument,
  ] = useState(false);

  // ======================================================
  // CREATE SPREADSHEET
  // ======================================================

  const [
    showSpreadsheetModal,
    setShowSpreadsheetModal,
  ] = useState(false);

  const [
    spreadsheetName,
    setSpreadsheetName,
  ] = useState("");

  const [
    creatingSpreadsheet,
    setCreatingSpreadsheet,
  ] = useState(false);

  // ======================================================
  // CREATE PRESENTATION
  // ======================================================

  const [
    showPresentationModal,
    setShowPresentationModal,
  ] = useState(false);

  const [
    presentationName,
    setPresentationName,
  ] = useState("");

  const [
    creatingPresentation,
    setCreatingPresentation,
  ] = useState(false);

  // ======================================================
  // TEMPLATE GALLERY
  // ======================================================

  const [
    templateGalleryType,
    setTemplateGalleryType,
  ] = useState(null);

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState(null);

  // ======================================================
  // UPLOAD
  // ======================================================

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadingFolder,
    setUploadingFolder,
  ] = useState(false);

  // ======================================================
  // DRAG AND DROP
  // ======================================================

  const [
    folderDropTargetId,
    setFolderDropTargetId,
  ] = useState(null);

  const [
    dragMoveCount,
    setDragMoveCount,
  ] = useState(0);

  // ======================================================
  // SEARCH
  // ======================================================

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    searchType,
    setSearchType,
  ] = useState("all");

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    isSearchMode,
    setIsSearchMode,
  ] = useState(false);

  // ======================================================
  // SHARE
  // ======================================================

  const [
    showShareModal,
    setShowShareModal,
  ] = useState(false);

  const [
    shareTarget,
    setShareTarget,
  ] = useState(null);

  const [
    shareEmail,
    setShareEmail,
  ] = useState("");

  const [
    sharePermission,
    setSharePermission,
  ] = useState("viewer");

  const [
    sharing,
    setSharing,
  ] = useState(false);

  const [
    shareError,
    setShareError,
  ] = useState("");

  const [
    shareSuccess,
    setShareSuccess,
  ] = useState("");

  const [
    existingShares,
    setExistingShares,
  ] = useState([]);

  const [
    loadingShares,
    setLoadingShares,
  ] = useState(false);

  const [
    updatingShareId,
    setUpdatingShareId,
  ] = useState(null);

  const [
    revokingShareId,
    setRevokingShareId,
  ] = useState(null);

  // ======================================================
  // FILE GROUPS
  // ======================================================

  const documents =
    files.filter(
      (file) =>
        file.fileKind ===
        "document"
    );

  const spreadsheets =
    files.filter(
      (file) =>
        file.fileKind ===
        "spreadsheet"
    );

  const presentations =
    files.filter(
      (file) =>
        file.fileKind ===
        "presentation"
    );

  const regularFiles =
    files.filter(
      (file) =>
        file.fileKind !==
          "document" &&
        file.fileKind !==
          "spreadsheet" &&
        file.fileKind !==
          "presentation"
    );

  // ======================================================
  // LOAD DRIVE
  // ======================================================

  const loadDrive =
    async (
      folderId = null
    ) => {
      try {
        setLoading(true);
        setError("");

        const endpoint =
          folderId
            ? `/folders/${folderId}`
            : "/folders/root";

        const response =
          await api.get(
            endpoint
          );

        setFolders(
          response.data
            .folders || []
        );

        setFiles(
          response.data
            .files || []
        );
      } catch (err) {
        console.error(
          "Drive load error:",
          err
        );

        if (
          err.response
            ?.status === 401
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          navigate(
            "/login"
          );

          return;
        }

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to load your drive."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const linkedFolderId =
      params.get(
        "folder"
      );

    const linkedFileId =
      params.get(
        "file"
      );

    const openDeepLink =
      async () => {
        if (linkedFolderId) {
          try {
            setLoading(true);
            setError("");

            const response =
              await api.get(
                `/folders/${linkedFolderId}`
              );

            const folder =
              response.data
                ?.folder || {
                id:
                  linkedFolderId,
                name:
                  "Folder",
              };

            setCurrentFolder(
              folder
            );

            setFolderHistory(
              []
            );

            setFolders(
              response.data
                ?.folders ||
                []
            );

            setFiles(
              response.data
                ?.files || []
            );

            return;
          } catch (err) {
            console.error(
              "Open folder link error:",
              err
            );

            setError(
              err.response?.data
                ?.error?.message ||
                "Unable to open this folder link."
            );
          } finally {
            setLoading(false);
          }

          return;
        }

        if (linkedFileId) {
          try {
            setLoading(true);
            setError("");

            const response =
              await api.get(
                `/files/${linkedFileId}`
              );

            const fileUrl =
              response.data
                ?.downloadUrl ||
              response.data
                ?.signedUrl ||
              response.data
                ?.url ||
              response.data
                ?.file
                ?.downloadUrl ||
              response.data
                ?.file
                ?.signedUrl ||
              response.data
                ?.file?.url;

            if (!fileUrl) {
              throw new Error(
                "File URL was not returned"
              );
            }

            window.open(
              fileUrl,
              "_blank",
              "noopener,noreferrer"
            );
          } catch (err) {
            console.error(
              "Open file link error:",
              err
            );

            setError(
              err.response?.data
                ?.error?.message ||
                err.message ||
                "Unable to open this file link."
            );
          } finally {
            setLoading(false);
          }

          return;
        }

        await loadDrive();
      };

    openDeepLink();
  }, []);

  // ======================================================
  // SIDEBAR NEW MENU ACTIONS
  // ======================================================

  useEffect(() => {
    const action =
      location.state?.action;

    if (!action) {
      return;
    }

    if (
      action ===
      "new-folder"
    ) {
      setError("");
      setMessage("");
      setFolderName("");

      setShowFolderModal(
        true
      );
    }

    if (
      action ===
      "upload-file"
    ) {
      setError("");
      setMessage("");

      setTimeout(() => {
        fileInputRef
          .current
          ?.click();
      }, 100);
    }

    if (
      action ===
      "upload-folder"
    ) {
      setError("");
      setMessage("");

      setTimeout(() => {
        folderInputRef
          .current
          ?.click();
      }, 100);
    }

    if (
      action ===
      "new-project"
    ) {
      setError("");
      setMessage("");
      setProjectName("");

      setShowProjectModal(
        true
      );
    }

    if (
      action ===
      "new-document"
    ) {
      setError("");
      setMessage("");
      setDocumentName("");

      setShowDocumentModal(
        true
      );
    }

    if (
      action ===
      "new-spreadsheet"
    ) {
      setError("");
      setMessage("");

      setSelectedTemplate(
        null
      );

      setSpreadsheetName(
        ""
      );

      setShowSpreadsheetModal(
        true
      );
    }

    if (
      action ===
      "new-presentation"
    ) {
      setError("");
      setMessage("");

      setSelectedTemplate(
        null
      );

      setPresentationName(
        ""
      );

      setShowPresentationModal(
        true
      );
    }

    // ==================================================
    // SPREADSHEET TEMPLATE
    // ==================================================

    if (
      action ===
      "new-spreadsheet-template"
    ) {
      setError("");
      setMessage("");

      setSelectedTemplate(
        null
      );

      setTemplateGalleryType(
        "spreadsheet"
      );
    }

    // ==================================================
    // PRESENTATION TEMPLATE
    // ==================================================

    if (
      action ===
      "new-presentation-template"
    ) {
      setError("");
      setMessage("");

      setSelectedTemplate(
        null
      );

      setTemplateGalleryType(
        "presentation"
      );
    }

    navigate(
      location.pathname,
      {
        replace: true,
        state: {},
      }
    );
  }, [
    location.state,
    location.pathname,
    navigate,
  ]);

  // ======================================================
  // TEMPLATE SELECTION
  // ======================================================

  const handleSelectTemplate = (
  template
) => {
  console.log(
    "Selected template:",
    template
  );

  setSelectedTemplate({
    ...template,
  });

  if (
    templateGalleryType ===
    "spreadsheet"
  ) {
    setSpreadsheetName(
      template.name
    );

    setShowSpreadsheetModal(
      true
    );
  }

  if (
    templateGalleryType ===
    "presentation"
  ) {
    setPresentationName(
      template.name
    );

    setShowPresentationModal(
      true
    );
  }

  setTemplateGalleryType(
    null
  );
};

  // ======================================================
  // CLOSE TEMPLATE GALLERY
  // ======================================================

  const handleCloseTemplateGallery =
    () => {
      setTemplateGalleryType(
        null
      );

      setSelectedTemplate(
        null
      );
    };

  // ======================================================
  // SEARCH
  // ======================================================

  const performSearch =
    async (
      term,
      type = searchType
    ) => {
      try {
        setSearching(true);
        setError("");
        setMessage("");

        const cleanTerm =
          term.trim();

        const response =
          await api.get(
            "/search",
            {
              params: {
                q: cleanTerm,
                type,
                sortBy:
                  "name",
                order:
                  "asc",
              },
            }
          );

        setFolders(
          response.data
            .folders || []
        );

        setFiles(
          response.data
            .files || []
        );

        setIsSearchMode(
          cleanTerm.length >
            0 ||
            type !== "all"
        );
      } catch (err) {
        console.error(
          "Search error:",
          err
        );

        if (
          err.response
            ?.status === 401
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          navigate(
            "/login"
          );

          return;
        }

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to search."
        );
      } finally {
        setSearching(false);
      }
    };

  const handleSearchSubmit =
    async (e) => {
      e.preventDefault();

      if (
        !searchTerm.trim() &&
        searchType ===
          "all"
      ) {
        setIsSearchMode(
          false
        );

        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );

        return;
      }

      await performSearch(
        searchTerm,
        searchType
      );
    };

  const handleSearchTypeChange =
    async (e) => {
      const newType =
        e.target.value;

      setSearchType(
        newType
      );

      setError("");
      setMessage("");

      if (
        newType === "all" &&
        !searchTerm.trim()
      ) {
        setIsSearchMode(
          false
        );

        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );

        return;
      }

      await performSearch(
        searchTerm,
        newType
      );
    };

  const handleClearSearch =
    async () => {
      setSearchTerm("");
      setSearchType("all");
      setIsSearchMode(false);

      setMessage("");
      setError("");

      await loadDrive(
        currentFolder
          ? currentFolder.id
          : null
      );
    };

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout =
    () => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      navigate(
        "/login"
      );
    };

  // ======================================================
  // OPEN FOLDER
  // ======================================================

  const handleOpenFolder =
    async (folder) => {
      setMessage("");
      setError("");
      setSelectedItems([]);

      if (
        isSearchMode
      ) {
        setSearchTerm("");
        setSearchType("all");
        setIsSearchMode(
          false
        );

        setFolderHistory(
          []
        );

        setCurrentFolder(
          folder
        );

        await loadDrive(
          folder.id
        );

        return;
      }

      setFolderHistory(
        (prev) => [
          ...prev,

          currentFolder
            ? currentFolder
            : {
                id: null,
                name:
                  "My Drive",
              },
        ]
      );

      setCurrentFolder(
        folder
      );

      await loadDrive(
        folder.id
      );
    };

  // ======================================================
  // BACK
  // ======================================================

  const handleBack =
    async () => {
      setSelectedItems([]);
      if (
        folderHistory.length ===
        0
      ) {
        setCurrentFolder(
          null
        );

        await loadDrive();

        return;
      }

      const previousFolder =
        folderHistory[
          folderHistory.length -
            1
        ];

      setFolderHistory(
        (prev) =>
          prev.slice(
            0,
            -1
          )
      );

      setMessage("");
      setError("");

      if (
        previousFolder.id ===
        null
      ) {
        setCurrentFolder(
          null
        );

        await loadDrive();
      } else {
        setCurrentFolder(
          previousFolder
        );

        await loadDrive(
          previousFolder.id
        );
      }
    };

  // ======================================================
  // ROOT
  // ======================================================

  const handleGoToRoot =
    async () => {
      setSelectedItems([]);
      setCurrentFolder(
        null
      );

      setFolderHistory(
        []
      );

      setSearchTerm("");
      setSearchType("all");
      setIsSearchMode(
        false
      );

      setMessage("");
      setError("");

      await loadDrive();
    };

  // ======================================================
  // CREATE FOLDER
  // ======================================================

  const handleCreateFolder =
    async (e) => {
      e.preventDefault();

      if (
        !folderName.trim()
      ) {
        return;
      }

      try {
        setCreatingFolder(
          true
        );

        setError("");
        setMessage("");

        await api.post(
          "/folders",
          {
            name:
              folderName.trim(),

            parentId:
              currentFolder
                ? currentFolder.id
                : null,
          }
        );

        setFolderName("");

        setShowFolderModal(
          false
        );

        setMessage(
          "Folder created successfully."
        );

        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );
      } catch (err) {
        console.error(
          "Create folder error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to create folder."
        );
      } finally {
        setCreatingFolder(
          false
        );
      }
    };

  // ======================================================
  // CREATE PROJECT
  // ======================================================

  const handleCreateProject =
    async (e) => {
      e.preventDefault();

      if (
        !projectName.trim()
      ) {
        return;
      }

      try {
        setCreatingProject(
          true
        );

        setError("");
        setMessage("");

        const response =
          await api.post(
            "/folders/project",
            {
              name:
                projectName.trim(),

              parentId:
                currentFolder
                  ? currentFolder.id
                  : null,
            }
          );

        const createdName =
          response.data
            ?.project?.name ||
          projectName.trim();

        setProjectName("");

        setShowProjectModal(
          false
        );

        setMessage(
          `Project "${createdName}" created successfully with Documents, Assets, Data, and Notes folders.`
        );

        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );
      } catch (err) {
        console.error(
          "Create project error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to create project."
        );
      } finally {
        setCreatingProject(
          false
        );
      }
    };

  // ======================================================
  // CREATE DOCUMENT
  // ======================================================

  const handleCreateDocument =
    async (e) => {
      e.preventDefault();

      const cleanName =
        documentName.trim();

      if (!cleanName) {
        return;
      }

      try {
        setCreatingDocument(
          true
        );

        setError("");
        setMessage("");

        const response =
          await api.post(
            "/files/documents",
            {
              name:
                cleanName,

              folderId:
                currentFolder
                  ? currentFolder.id
                  : null,
            }
          );

        const createdDocument =
          response.data
            ?.document;

        if (
          !createdDocument?.id
        ) {
          throw new Error(
            "Document ID was not returned."
          );
        }

        setDocumentName("");

        setShowDocumentModal(
          false
        );

        navigate(
          `/documents/${createdDocument.id}`,
          {
            state: {
              returnTo:
                "/dashboard",
            },
          }
        );
      } catch (err) {
        console.error(
          "Create document error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            err.message ||
            "Unable to create document."
        );
      } finally {
        setCreatingDocument(
          false
        );
      }
    };

  // ======================================================
  // CREATE SPREADSHEET
  // ======================================================

  const handleCreateSpreadsheet =
    async (e) => {
      e.preventDefault();

      const cleanName =
        spreadsheetName.trim();

      if (!cleanName) {
        return;
      }

      try {
        setCreatingSpreadsheet(
          true
        );

        setError("");
        setMessage("");

        const payload = {
          name:
            cleanName,

          folderId:
            currentFolder
              ? currentFolder.id
              : null,
        };

        /*
          We include templateId now.

          The backend does not use it yet,
          but this prepares the frontend for
          the next step where the backend will
          generate real template content.
        */

        if (
          selectedTemplate?.id
        ) {
          payload.templateId =
            selectedTemplate.id;
        }

        const response =
          await api.post(
            "/files/spreadsheets",
            payload
          );

        const createdSpreadsheet =
          response.data
            ?.spreadsheet;

        if (
          !createdSpreadsheet?.id
        ) {
          throw new Error(
            "Spreadsheet ID was not returned."
          );
        }

        setSpreadsheetName(
          ""
        );

        setSelectedTemplate(
          null
        );

        setShowSpreadsheetModal(
          false
        );

        navigate(
          `/spreadsheets/${createdSpreadsheet.id}`,
          {
            state: {
              returnTo:
                "/dashboard",
            },
          }
        );
      } catch (err) {
        console.error(
          "Create spreadsheet error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            err.message ||
            "Unable to create spreadsheet."
        );
      } finally {
        setCreatingSpreadsheet(
          false
        );
      }
    };

  // ======================================================
  // CREATE PRESENTATION
  // ======================================================

  const handleCreatePresentation =
  async (e) => {
    e.preventDefault();

    const cleanName =
      presentationName.trim();

    if (!cleanName) {
      return;
    }

    try {
      setCreatingPresentation(true);
      setError("");
      setMessage("");

      const payload = {
        name: cleanName,
        folderId:
          currentFolder
            ? currentFolder.id
            : null,
        templateId:
          selectedTemplate?.id ||
          null,
      };

      console.log(
        "Creating presentation:",
        payload
      );

      const response =
        await api.post(
          "/files/presentations",
          payload
        );

        console.log(
  "PRESENTATION API RESPONSE:",
  response.data
);

console.log(
  "TEMPLATE INSIDE DATA:",
  response.data
    ?.presentation
    ?.data
    ?.templateId
);

console.log(
  "SLIDES INSIDE DATA:",
  response.data
    ?.presentation
    ?.data
    ?.slides
    ?.length
);

console.log(
  "ACTIVE SLIDE:",
  response.data
    ?.presentation
    ?.data
    ?.activeSlideId
);

      const createdPresentation =
        response.data
          ?.presentation;

      if (
        !createdPresentation?.id
      ) {
        throw new Error(
          "Presentation ID was not returned."
        );
      }

      setPresentationName("");
      setSelectedTemplate(null);
      setShowPresentationModal(false);

      navigate(
        `/presentations/${createdPresentation.id}`,
        {
          state: {
            returnTo:
              "/dashboard",
          },
        }
      );
    } catch (err) {
      console.error(
        "Create presentation error:",
        err
      );

      setError(
        err.response?.data
          ?.error?.message ||
        err.response?.data
          ?.message ||
        err.message ||
        "Unable to create presentation."
      );
    } finally {
      setCreatingPresentation(false);
    }
  };

  // ======================================================
  // DOWNLOAD FILE
  // ======================================================

  const handleDownloadFile =
    async (file) => {
      try {
        setError("");
        setMessage("");

        const response =
          await api.get(
            `/files/${file.id}`
          );

        const fileUrl =
          response.data
            ?.downloadUrl ||
          response.data
            ?.signedUrl ||
          response.data
            ?.url ||
          response.data
            ?.file
            ?.downloadUrl ||
          response.data
            ?.file
            ?.signedUrl ||
          response.data
            ?.file
            ?.url;

        if (!fileUrl) {
          throw new Error(
            "Download URL not returned"
          );
        }

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          fileUrl;

        anchor.download =
          file.name ||
          getItemDisplayName(
            file
          ) ||
          "download";

        anchor.target =
          "_blank";

        anchor.rel =
          "noopener noreferrer";

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();
      } catch (err) {
        console.error(
          "Download file error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            err.message ||
            "Unable to download file."
        );
      }
    };

  // ======================================================
  // DETAILS
  // ======================================================

  const handleShowDetails =
    (
      resourceType,
      item
    ) => {
      setDetailsTarget({
        resourceType,
        item,
      });
    };


  // ======================================================
  // COPY LINK
  // ======================================================

  const handleCopyLink =
    async (
      resourceType,
      item
    ) => {
      try {
        setError("");

        let link;

        if (
          resourceType ===
          "folder"
        ) {
          link =
            `${window.location.origin}/dashboard?folder=${item.id}`;
        } else if (
          item.fileKind ===
          "document"
        ) {
          link =
            `${window.location.origin}/documents/${item.id}`;
        } else if (
          item.fileKind ===
          "spreadsheet"
        ) {
          link =
            `${window.location.origin}/spreadsheets/${item.id}`;
        } else if (
          item.fileKind ===
          "presentation"
        ) {
          link =
            `${window.location.origin}/presentations/${item.id}`;
        } else {
          link =
            `${window.location.origin}/dashboard?file=${item.id}`;
        }

        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard.writeText(
            link
          );
        } else {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            link;

          textarea.style.position =
            "fixed";

          textarea.style.opacity =
            "0";

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            "copy"
          );

          textarea.remove();
        }

        setMessage(
          "Link copied to clipboard."
        );
      } catch (err) {
        console.error(
          "Copy link error:",
          err
        );

        setError(
          "Unable to copy link."
        );
      }
    };

  // ======================================================
  // MOVE ITEM
  // ======================================================

  const loadMoveFolder =
    async (
      folder = null
    ) => {
      try {
        setLoadingMoveFolders(
          true
        );

        setError("");

        const endpoint =
          folder?.id
            ? `/folders/${folder.id}`
            : "/folders/root";

        const response =
          await api.get(
            endpoint
          );

        const selectedFolderIds =
          new Set(
            moveTarget
              ?.resourceType ===
              "bulk"
              ? (
                  moveTarget.items ||
                  []
                )
                  .filter(
                    (selected) =>
                      selected.resourceType ===
                      "folder"
                  )
                  .map(
                    (selected) =>
                      String(
                        selected.item.id
                      )
                  )
              : moveTarget
                  ?.resourceType ===
                  "folder"
                ? [
                    String(
                      moveTarget.item.id
                    ),
                  ]
                : []
          );

        const availableFolders =
          (
            response.data
              ?.folders || []
          ).filter(
            (folderItem) =>
              !selectedFolderIds.has(
                String(
                  folderItem.id
                )
              )
          );

        setMoveFolders(
          availableFolders
        );
      } catch (err) {
        console.error(
          "Load move folders error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            "Unable to load destination folders."
        );
      } finally {
        setLoadingMoveFolders(
          false
        );
      }
    };

  const handleOpenMoveModal =
    async (
      resourceType,
      item
    ) => {
      const target = {
        resourceType,
        item,
      };

      setMoveTarget(
        target
      );

      setMoveBrowserFolder(
        null
      );

      setMoveFolderHistory(
        []
      );

      try {
        setLoadingMoveFolders(
          true
        );

        const response =
          await api.get(
            "/folders/root"
          );

        setMoveFolders(
          (
            response.data
              ?.folders || []
          ).filter(
            (folderItem) =>
              !(
                resourceType ===
                  "folder" &&
                folderItem.id ===
                  item.id
              )
          )
        );
      } catch (err) {
        console.error(
          "Open move modal error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            "Unable to load folders."
        );
      } finally {
        setLoadingMoveFolders(
          false
        );
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

      setMoveBrowserFolder(
        folder
      );

      await loadMoveFolder(
        folder
      );
    };

  const handleMoveBrowserBack =
    async () => {
      if (
        moveFolderHistory.length ===
        0
      ) {
        setMoveBrowserFolder(
          null
        );

        await loadMoveFolder(
          null
        );

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

  const handleConfirmMove =
    async () => {
      if (!moveTarget) {
        return;
      }

      try {
        setMovingItem(true);
        setError("");
        setMessage("");

        const destinationId =
          moveBrowserFolder
            ?.id || null;

        if (
          moveTarget
            .resourceType ===
          "bulk"
        ) {
          const items =
            moveTarget.items ||
            [];

          const results =
            await Promise.allSettled(
              items.map(
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
              movedCount === 1
                ? ""
                : "s"
            } moved successfully.`
          );

          if (
            failed.length >
            0
          ) {
            setError(
              `${failed.length} item${
                failed.length === 1
                  ? ""
                  : "s"
              } could not be moved.`
            );
          }

          setSelectedItems([]);
        } else if (
          moveTarget
            .resourceType ===
          "folder"
        ) {
          await api.patch(
            `/folders/${moveTarget.item.id}`,
            {
              parentId:
                destinationId,
            }
          );

          setMessage(
            `Moved "${getItemDisplayName(
              moveTarget.item
            )}" successfully.`
          );
        } else {
          await api.patch(
            `/files/${moveTarget.item.id}`,
            {
              folderId:
                destinationId,
            }
          );

          setMessage(
            `Moved "${getItemDisplayName(
              moveTarget.item
            )}" successfully.`
          );
        }

        setMoveTarget(
          null
        );

        setMoveBrowserFolder(
          null
        );

        setMoveFolderHistory(
          []
        );

        setMoveFolders(
          []
        );

        if (isSearchMode) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Move item error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to move this item."
        );
      } finally {
        setMovingItem(false);
      }
    };

  // ======================================================
  // MULTI SELECT
  // ======================================================

  const getSelectionKey =
    (
      resourceType,
      item
    ) =>
      `${resourceType}:${item.id}`;

  const isItemSelected =
    (
      resourceType,
      item
    ) => {
      const key =
        getSelectionKey(
          resourceType,
          item
        );

      return selectedItems.some(
        (selected) =>
          selected.key ===
          key
      );
    };

  const handleToggleSelection =
    (
      resourceType,
      item
    ) => {
      const key =
        getSelectionKey(
          resourceType,
          item
        );

      setSelectedItems(
        (current) => {
          const alreadySelected =
            current.some(
              (selected) =>
                selected.key ===
                key
            );

          if (alreadySelected) {
            return current.filter(
              (selected) =>
                selected.key !==
                key
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
        }
      );
    };

  const handleClearSelection =
    () => {
      setSelectedItems([]);
    };

  const handleRequestBulkDelete =
    () => {
      if (
        selectedItems.length ===
        0
      ) {
        return;
      }

      setShowBulkDeleteConfirm(
        true
      );
    };

  const handleConfirmBulkDelete =
    async () => {
      if (
        selectedItems.length ===
        0
      ) {
        return;
      }

      try {
        setBulkDeleting(true);
        setError("");
        setMessage("");

        const itemsToDelete = [
          ...selectedItems,
        ];

        const results =
          await Promise.allSettled(
            itemsToDelete.map(
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

        setShowBulkDeleteConfirm(
          false
        );

        setSelectedItems([]);

        if (
          failed.length ===
          0
        ) {
          setMessage(
            `${deletedCount} item${
              deletedCount === 1
                ? ""
                : "s"
            } moved to Trash.`
          );
        } else {
          setMessage(
            `${deletedCount} item${
              deletedCount === 1
                ? ""
                : "s"
            } moved to Trash.`
          );

          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be deleted.`
          );
        }

        if (
          isSearchMode
        ) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Bulk delete error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to delete the selected items."
        );
      } finally {
        setBulkDeleting(false);
      }
    };

  // Delete key opens the same confirmation dialog.
  useEffect(() => {
    const handleDeleteKey =
      (event) => {
        const activeTag =
          document.activeElement
            ?.tagName
            ?.toLowerCase();

        const editing =
          activeTag ===
            "input" ||
          activeTag ===
            "textarea" ||
          activeTag ===
            "select" ||
          document.activeElement
            ?.isContentEditable;

        if (
          event.key ===
            "Delete" &&
          !editing &&
          selectedItems.length >
            0 &&
          !showBulkDeleteConfirm
        ) {
          event.preventDefault();

          setShowBulkDeleteConfirm(
            true
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleDeleteKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleDeleteKey
      );
    };
  }, [
    selectedItems,
    showBulkDeleteConfirm,
  ]);

  // ======================================================
  // DRAG / MARQUEE SELECTION
  // ======================================================

  const getSelectionRecordFromKey =
    (key) => {
      if (!key) {
        return null;
      }

      const [
        resourceType,
        id,
      ] = key.split(":");

      if (
        resourceType ===
        "folder"
      ) {
        const item =
          folders.find(
            (folder) =>
              String(
                folder.id
              ) ===
              String(id)
          );

        if (!item) {
          return null;
        }

        return {
          key:
            `folder:${item.id}`,
          resourceType:
            "folder",
          item,
        };
      }

      const item =
        files.find(
          (file) =>
            String(
              file.id
            ) ===
            String(id)
        );

      if (!item) {
        return null;
      }

      return {
        key:
          `file:${item.id}`,
        resourceType:
          "file",
        item,
      };
    };

  const handleSelectionPointerDown =
    (event) => {
      if (
        event.button !== 0
      ) {
        return;
      }

      // Let normal buttons, inputs, links and menus work normally.
      if (
        event.target.closest(
          "button, input, textarea, select, a, [data-no-marquee='true'], [draggable='true']"
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
        event.clientX -
        rect.left;

      const startY =
        event.clientY -
        rect.top;

      dragBaseSelectionRef.current =
        event.ctrlKey ||
        event.metaKey
          ? [
              ...selectedItems,
            ]
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
        currentX:
          startX,
        currentY:
          startY,
        moved:
          false,
      });

      try {
        event.currentTarget.setPointerCapture(
          event.pointerId
        );
      } catch {
        // Pointer capture is optional.
      }
    };

  const handleSelectionPointerMove =
    (event) => {
      if (
        !dragSelection
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

      const currentX =
        event.clientX -
        rect.left;

      const currentY =
        event.clientY -
        rect.top;

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

      setDragSelection(
        next
      );

      if (!moved) {
        return;
      }

      const left =
        Math.min(
          next.startX,
          currentX
        ) +
        rect.left;

      const right =
        Math.max(
          next.startX,
          currentX
        ) +
        rect.left;

      const top =
        Math.min(
          next.startY,
          currentY
        ) +
        rect.top;

      const bottom =
        Math.max(
          next.startY,
          currentY
        ) +
        rect.top;

      const nodes =
        container.querySelectorAll(
          "[data-selectable-item='true']"
        );

      const hitKeys = [];

      nodes.forEach(
        (node) => {
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

          if (intersects) {
            const key =
              node.getAttribute(
                "data-selection-key"
              );

            if (key) {
              hitKeys.push(
                key
              );
            }
          }
        }
      );

      const base =
        dragBaseSelectionRef.current;

      const merged =
        new Map();

      base.forEach(
        (record) => {
          merged.set(
            record.key,
            record
          );
        }
      );

      hitKeys.forEach(
        (key) => {
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
        }
      );

      setSelectedItems(
        Array.from(
          merged.values()
        )
      );
    };

  const handleSelectionPointerUp =
    (event) => {
      if (
        !dragSelection
      ) {
        return;
      }

      try {
        event.currentTarget.releasePointerCapture(
          dragSelection.pointerId
        );
      } catch {
        // Pointer release is optional.
      }

      setDragSelection(
        null
      );
    };

  const handleDownloadSelected =
    async () => {
      const selectedFiles =
        selectedItems.filter(
          (selected) =>
            selected.resourceType ===
            "file"
        );

      for (
        const selected of
        selectedFiles
      ) {
        // Keep downloads sequential so each item uses the
        // same working download flow as the normal menu.
        await handleDownloadFile(
          selected.item
        );
      }
    };

  const handleShareSelected =
    () => {
      if (
        selectedItems.length ===
        0
      ) {
        return;
      }

      if (
        selectedItems.length ===
        1
      ) {
        const selected =
          selectedItems[0];

        handleOpenShareModal(
          selected.resourceType,
          selected.item
        );

        return;
      }

      setBulkShareEmail("");
      setBulkSharePermission(
        "viewer"
      );
      setShowBulkShareModal(
        true
      );
    };

  const handleSubmitBulkShare =
    async (event) => {
      event.preventDefault();

      const email =
        bulkShareEmail
          .trim()
          .toLowerCase();

      if (
        !email ||
        selectedItems.length ===
        0
      ) {
        return;
      }

      try {
        setBulkSharing(true);
        setError("");
        setMessage("");

        const results =
          await Promise.allSettled(
            selectedItems.map(
              (selected) => {
                const payload = {
                  email,
                  permission:
                    bulkSharePermission,
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

        setShowBulkShareModal(
          false
        );

        setBulkShareEmail("");

        setMessage(
          `${sharedCount} item${
            sharedCount === 1
              ? ""
              : "s"
          } shared successfully.`
        );

        if (
          failed.length >
          0
        ) {
          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be shared.`
          );
        }
      } catch (err) {
        console.error(
          "Bulk share error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to share the selected items."
        );
      } finally {
        setBulkSharing(false);
      }
    };

  const buildItemLink =
    (
      resourceType,
      item
    ) => {
      if (
        resourceType ===
        "folder"
      ) {
        return `${window.location.origin}/dashboard?folder=${item.id}`;
      }

      if (
        item.fileKind ===
        "document"
      ) {
        return `${window.location.origin}/documents/${item.id}`;
      }

      if (
        item.fileKind ===
        "spreadsheet"
      ) {
        return `${window.location.origin}/spreadsheets/${item.id}`;
      }

      if (
        item.fileKind ===
        "presentation"
      ) {
        return `${window.location.origin}/presentations/${item.id}`;
      }

      return `${window.location.origin}/dashboard?file=${item.id}`;
    };

  const handleCopySelectedLink =
    async () => {
      if (
        selectedItems.length ===
        0
      ) {
        return;
      }

      try {
        setError("");

        const textToCopy =
          selectedItems
            .map(
              (selected) =>
                buildItemLink(
                  selected.resourceType,
                  selected.item
                )
            )
            .join("\\n");

        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard.writeText(
            textToCopy
          );
        } else {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            textToCopy;

          textarea.style.position =
            "fixed";

          textarea.style.opacity =
            "0";

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            "copy"
          );

          textarea.remove();
        }

        setMessage(
          selectedItems.length ===
          1
            ? "Link copied to clipboard."
            : `${selectedItems.length} links copied to clipboard.`
        );
      } catch (err) {
        console.error(
          "Copy selected links error:",
          err
        );

        setError(
          "Unable to copy the selected links."
        );
      }
    };

  const handleToggleSelectedStar =
    async () => {
      if (
        selectedItems.length ===
        0
      ) {
        return;
      }

      try {
        setError("");
        setMessage("");

        const shouldStar =
          selectedItems.some(
            (selected) =>
              !selected.item
                ?.isStarred
          );

        const results =
          await Promise.allSettled(
            selectedItems.map(
              async (
                selected
              ) => {
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
            ? `Selected items added to Starred.`
            : `Selected items removed from Starred.`
        );

        if (
          failed.length >
          0
        ) {
          setError(
            `${failed.length} item${
              failed.length === 1
                ? ""
                : "s"
            } could not be updated.`
          );
        }

        setSelectedItems([]);

        if (
          isSearchMode
        ) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Bulk star error:",
          err
        );

        setError(
          "Unable to update Starred status."
        );
      }
    };

  const handleOpenSelectedMove =
    async () => {
      if (
        selectedItems.length ===
        0
      ) {
        return;
      }

      if (
        selectedItems.length ===
        1
      ) {
        const selected =
          selectedItems[0];

        await handleOpenMoveModal(
          selected.resourceType,
          selected.item
        );

        return;
      }

      const target = {
        resourceType:
          "bulk",
        items: [
          ...selectedItems,
        ],
      };

      setMoveTarget(
        target
      );

      setMoveBrowserFolder(
        null
      );

      setMoveFolderHistory(
        []
      );

      try {
        setLoadingMoveFolders(
          true
        );

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
              .map(
                (selected) =>
                  String(
                    selected.item.id
                  )
              )
          );

        setMoveFolders(
          (
            response.data
              ?.folders || []
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
        console.error(
          "Open bulk move modal error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            "Unable to load folders."
        );
      } finally {
        setLoadingMoveFolders(
          false
        );
      }
    };

  // ======================================================
  // RENAME FOLDER
  // ======================================================

  const handleRenameFolder =
    async (folder) => {
      const newName =
        window.prompt(
          "Enter new folder name:",
          folder.name
        );

      if (
        !newName ||
        !newName.trim() ||
        newName.trim() ===
          folder.name
      ) {
        return;
      }

      try {
        setError("");
        setMessage("");

        await api.patch(
          `/folders/${folder.id}`,
          {
            name:
              newName.trim(),
          }
        );

        setMessage(
          "Folder renamed successfully."
        );

        if (
          isSearchMode
        ) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Rename folder error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to rename folder."
        );
      }
    };

  // ======================================================
  // TRASH FOLDER
  // ======================================================

  const handleTrashFolder =
    async (folder) => {
      const confirmed =
        window.confirm(
          `Move "${folder.name}" to Trash?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        await api.delete(
          `/folders/${folder.id}`
        );

        setMessage(
          "Folder moved to Trash."
        );

        if (
          isSearchMode
        ) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Trash folder error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to move folder to Trash."
        );
      }
    };

  // ======================================================
  // STAR FOLDER
  // ======================================================

  const handleToggleFolderStar =
    async (folder) => {
      try {
        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/starred/folders/${folder.id}`
          );

        const isStarred =
          response.data
            .folder
            ?.isStarred;

        setFolders(
          (
            currentFolders
          ) =>
            currentFolders.map(
              (item) =>
                item.id ===
                folder.id
                  ? {
                      ...item,
                      isStarred,
                    }
                  : item
            )
        );

        setMessage(
          isStarred
            ? `"${folder.name}" added to Starred.`
            : `"${folder.name}" removed from Starred.`
        );
      } catch (err) {
        console.error(
          "Toggle folder star error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to update folder star status."
        );
      }
    };

  // ======================================================
  // SINGLE FILE UPLOAD
  // ======================================================

  const handleUploadClick =
    () => {
      fileInputRef.current
        ?.click();
    };

  const handleFileUpload =
    async (e) => {
      const selectedFile =
        e.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      try {
        setUploading(true);
        setError("");
        setMessage("");

        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile
        );

        if (
          currentFolder
        ) {
          formData.append(
            "folderId",
            currentFolder.id
          );
        }

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
          "File uploaded successfully."
        );

        window.dispatchEvent(
            new Event(
                "cloud-drive-storage-changed"
        )
        );

        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );
      } catch (err) {
        console.error(
          "Upload error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to upload file."
        );
      } finally {
        setUploading(false);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }
      }
    };

  // ======================================================
  // FOLDER UPLOAD
  // ======================================================

  const handleFolderUpload =
    async (e) => {
      const selectedFiles =
        Array.from(
          e.target.files ||
            []
        );

      if (
        selectedFiles.length ===
        0
      ) {
        return;
      }

      try {
        setUploadingFolder(
          true
        );

        setError("");
        setMessage("");

        const formData =
          new FormData();

        const relativePaths =
          [];

        selectedFiles.forEach(
          (file) => {
            formData.append(
              "files",
              file
            );

            relativePaths.push(
              file.webkitRelativePath ||
                file.name
            );
          }
        );

        formData.append(
          "relativePaths",
          JSON.stringify(
            relativePaths
          )
        );

        if (
          currentFolder
        ) {
          formData.append(
            "parentFolderId",
            currentFolder.id
          );
        }

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
          response.data
            ?.uploaded?.files ??
          selectedFiles.length;

        const uploadedFolders =
          response.data
            ?.uploaded
            ?.folders ??
          0;

        setMessage(
          `Folder uploaded successfully. ${uploadedFiles} file${
            uploadedFiles ===
            1
              ? ""
              : "s"
          } and ${uploadedFolders} folder${
            uploadedFolders ===
            1
              ? ""
              : "s"
          } added.`
        );

        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );
      } catch (err) {
        console.error(
          "Folder upload error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to upload folder."
        );
      } finally {
        setUploadingFolder(
          false
        );

        if (
          folderInputRef.current
        ) {
          folderInputRef.current.value =
            "";
        }
      }
    };

  // ======================================================
  // PREVIEW REGULAR FILE
  // ======================================================

  const handlePreviewFile =
    (file) => {
      setError("");
      setMessage("");
      setPreviewFile(file);
    };

  // ======================================================
  // OPEN FILE
  // ======================================================

  const handleOpenFile =
    async (file) => {
      try {
        setError("");
        setMessage("");

        if (
          file.fileKind ===
          "document"
        ) {
          navigate(
            `/documents/${file.id}`,
            {
              state: {
                returnTo:
                  "/dashboard",
              },
            }
          );

          return;
        }

        if (
          file.fileKind ===
          "spreadsheet"
        ) {
          navigate(
            `/spreadsheets/${file.id}`,
            {
              state: {
                returnTo:
                  "/dashboard",
              },
            }
          );

          return;
        }

        if (
          file.fileKind ===
          "presentation"
        ) {
          navigate(
            `/presentations/${file.id}`,
            {
              state: {
                returnTo:
                  "/dashboard",
              },
            }
          );

          return;
        }

        const response =
          await api.get(
            `/files/${file.id}`
          );

        const fileUrl =
          response.data
            .downloadUrl ||
          response.data
            .signedUrl ||
          response.data.url ||
          response.data.file
            ?.downloadUrl ||
          response.data.file
            ?.signedUrl ||
          response.data.file
            ?.url;

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
          "Open file error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            err.message ||
            "Unable to open file."
        );
      }
    };

  // ======================================================
  // RENAME FILE
  // ======================================================

  const handleRenameFile =
    async (file) => {
      let currentName =
        getItemDisplayName(
          file
        );

      const newName =
        window.prompt(
          file.fileKind ===
            "document"
            ? "Enter new document name:"
            : file.fileKind ===
                "spreadsheet"
              ? "Enter new spreadsheet name:"
              : file.fileKind ===
                  "presentation"
                ? "Enter new presentation name:"
                : "Enter new file name:",
          currentName
        );

      if (
        !newName ||
        !newName.trim() ||
        newName.trim() ===
          currentName
      ) {
        return;
      }

      let finalName =
        newName.trim();

      if (
        file.fileKind ===
          "document" &&
        !finalName
          .toLowerCase()
          .endsWith(".txt")
      ) {
        finalName =
          `${finalName}.txt`;
      }

      if (
        file.fileKind ===
          "spreadsheet" &&
        !finalName
          .toLowerCase()
          .endsWith(
            ".cloudsheet"
          )
      ) {
        finalName =
          `${finalName}.cloudsheet`;
      }

      if (
        file.fileKind ===
          "presentation" &&
        !finalName
          .toLowerCase()
          .endsWith(
            ".cloudslides"
          )
      ) {
        finalName =
          `${finalName}.cloudslides`;
      }

      try {
        setError("");
        setMessage("");

        await api.patch(
          `/files/${file.id}`,
          {
            name:
              finalName,
          }
        );

        setMessage(
          file.fileKind ===
            "document"
            ? "Document renamed successfully."
            : file.fileKind ===
                "spreadsheet"
              ? "Spreadsheet renamed successfully."
              : file.fileKind ===
                  "presentation"
                ? "Presentation renamed successfully."
                : "File renamed successfully."
        );

        if (
          isSearchMode
        ) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Rename file error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to rename file."
        );
      }
    };

  // ======================================================
  // TRASH FILE
  // ======================================================

  const handleTrashFile =
    async (file) => {
      const displayName =
        getItemDisplayName(
          file
        );

      const confirmed =
        window.confirm(
          `Move "${displayName}" to Trash?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        await api.delete(
          `/files/${file.id}`
        );

        setMessage(
          file.fileKind ===
            "document"
            ? "Document moved to Trash."
            : file.fileKind ===
                "spreadsheet"
              ? "Spreadsheet moved to Trash."
              : file.fileKind ===
                  "presentation"
                ? "Presentation moved to Trash."
                : "File moved to Trash."
        );

        if (
          isSearchMode
        ) {
          await performSearch(
            searchTerm,
            searchType
          );
        } else {
          await loadDrive(
            currentFolder
              ? currentFolder.id
              : null
          );
        }
      } catch (err) {
        console.error(
          "Trash file error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to move file to Trash."
        );
      }
    };

  // ======================================================
  // STAR FILE
  // ======================================================

  const handleToggleFileStar =
    async (file) => {
      try {
        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/starred/files/${file.id}`
          );

        const isStarred =
          response.data
            .file
            ?.isStarred;

        setFiles(
          (
            currentFiles
          ) =>
            currentFiles.map(
              (item) =>
                item.id ===
                file.id
                  ? {
                      ...item,
                      isStarred,
                    }
                  : item
            )
        );

        const displayName =
          getItemDisplayName(
            file
          );

        setMessage(
          isStarred
            ? `"${displayName}" added to Starred.`
            : `"${displayName}" removed from Starred.`
        );
      } catch (err) {
        console.error(
          "Toggle file star error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to update file star status."
        );
      }
    };

  // ======================================================
  // GET SHARES
  // ======================================================

  const loadExistingShares =
    async (
      resourceType,
      itemId
    ) => {
      try {
        setLoadingShares(
          true
        );

        setShareError("");

        const params =
          resourceType ===
          "file"
            ? {
                fileId:
                  itemId,
              }
            : {
                folderId:
                  itemId,
              };

        const response =
          await api.get(
            "/shares",
            {
              params,
            }
          );

        setExistingShares(
          response.data
            ?.shares || []
        );
      } catch (err) {
        console.error(
          "Load existing shares error:",
          err
        );

        setExistingShares(
          []
        );

        setShareError(
          err.response?.data
            ?.error?.message ||
            "Unable to load sharing details."
        );
      } finally {
        setLoadingShares(
          false
        );
      }
    };

  // ======================================================
  // OPEN SHARE MODAL
  // ======================================================

  const handleOpenShareModal =
    async (
      resourceType,
      item
    ) => {
      setShareTarget({
        resourceType,
        item,
      });

      setShareEmail("");

      setSharePermission(
        "viewer"
      );

      setShareError("");
      setShareSuccess("");

      setExistingShares(
        []
      );

      setShowShareModal(
        true
      );

      await loadExistingShares(
        resourceType,
        item.id
      );
    };

  // ======================================================
  // CLOSE SHARE MODAL
  // ======================================================

  const handleCloseShareModal =
    () => {
      if (
        sharing ||
        updatingShareId ||
        revokingShareId
      ) {
        return;
      }

      setShowShareModal(
        false
      );

      setShareTarget(
        null
      );

      setShareEmail("");

      setSharePermission(
        "viewer"
      );

      setShareError("");
      setShareSuccess("");

      setExistingShares(
        []
      );
    };

  // ======================================================
  // CREATE SHARE
  // ======================================================

  const handleShareItem =
    async (e) => {
      e.preventDefault();

      if (
        !shareTarget ||
        !shareEmail.trim()
      ) {
        return;
      }

      try {
        setSharing(true);

        setShareError("");
        setShareSuccess("");

        const payload = {
          email:
            shareEmail
              .trim()
              .toLowerCase(),

          permission:
            sharePermission,
        };

        if (
          shareTarget
            .resourceType ===
          "file"
        ) {
          payload.fileId =
            shareTarget
              .item.id;
        } else {
          payload.folderId =
            shareTarget
              .item.id;
        }

        const response =
          await api.post(
            "/shares",
            payload
          );

        setShareSuccess(
          response.data
            ?.message ||
            "Item shared successfully."
        );

        setShareEmail("");

        setSharePermission(
          "viewer"
        );

        await loadExistingShares(
          shareTarget
            .resourceType,
          shareTarget
            .item.id
        );
      } catch (err) {
        console.error(
          "Share item error:",
          err
        );

        setShareError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to share this item."
        );
      } finally {
        setSharing(false);
      }
    };

  // ======================================================
  // CHANGE SHARE PERMISSION
  // ======================================================

  const handleUpdateSharePermission =
    async (
      shareId,
      permission
    ) => {
      try {
        setUpdatingShareId(
          shareId
        );

        setShareError("");
        setShareSuccess("");

        await api.patch(
          `/shares/${shareId}`,
          {
            permission,
          }
        );

        setExistingShares(
          (current) =>
            current.map(
              (share) =>
                share.id ===
                shareId
                  ? {
                      ...share,
                      permission,
                    }
                  : share
            )
        );

        setShareSuccess(
          "Permission updated successfully."
        );
      } catch (err) {
        console.error(
          "Update permission error:",
          err
        );

        setShareError(
          err.response?.data
            ?.error?.message ||
            "Unable to update permission."
        );
      } finally {
        setUpdatingShareId(
          null
        );
      }
    };

  // ======================================================
  // REVOKE SHARE
  // ======================================================

  const handleRevokeShare =
    async (share) => {
      const confirmed =
        window.confirm(
          `Remove access for ${
            share.user
              ?.email ||
            "this user"
          }?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setRevokingShareId(
          share.id
        );

        setShareError("");
        setShareSuccess("");

        await api.delete(
          `/shares/${share.id}`
        );

        setExistingShares(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                share.id
            )
        );

        setShareSuccess(
          "Access removed successfully."
        );
      } catch (err) {
        console.error(
          "Revoke share error:",
          err
        );

        setShareError(
          err.response?.data
            ?.error?.message ||
            "Unable to remove access."
        );
      } finally {
        setRevokingShareId(
          null
        );
      }
    };

    // ======================================================
// ASK GEMINI
// ======================================================

const handleAskGemini =
  async (
    customQuestion = null
  ) => {
    const question =
      (
        customQuestion ||
        geminiQuestion
      ).trim();

    if (!question) {
      setGeminiError(
        "Please enter a question."
      );

      return;
    }

    if (
      selectedItems.length ===
      0
    ) {
      setGeminiError(
        "Select at least one file or folder."
      );

      return;
    }

    try {
      setGeminiLoading(
        true
      );

      setGeminiError(
        ""
      );

      setGeminiResponse(
        ""
      );

      const items =
        selectedItems.map(
          (selected) => ({
            id:
              selected.item.id,

            resourceType:
              selected.resourceType,
          })
        );

      const response =
        await api.post(
          "/gemini/ask",
          {
            question,
            items,
          }
        );

      const answer =
        response.data
          ?.answer;

      if (!answer) {
        throw new Error(
          "Gemini did not return an answer."
        );
      }

      setGeminiResponse(
        answer
      );

      setGeminiQuestion(
        question
      );
    } catch (err) {
      console.error(
        "Ask Gemini error:",
        err
      );

      setGeminiError(
        err.response?.data
          ?.error?.message ||
        err.response?.data
          ?.message ||
        err.message ||
        "Unable to get a response from Gemini."
      );
    } finally {
      setGeminiLoading(
        false
      );
    }
  };

   

  // ======================================================
  // DRAG AND DROP - HELPERS
  // ======================================================

  const refreshCurrentDriveAfterDrop =
    async () => {
      setSelectedItems([]);

      if (
        isSearchMode ||
        searchTerm.trim() ||
        searchType !== "all"
      ) {
        await performSearch(
          searchTerm,
          searchType
        );
      } else {
        await loadDrive(
          currentFolder
            ? currentFolder.id
            : null
        );
      }
    };

  const uploadDroppedEntries =
    async (
      droppedEntries,
      destinationFolderId = null
    ) => {
      if (
        !Array.isArray(
          droppedEntries
        ) ||
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
        if (
          containsFolderStructure
        ) {
          setUploadingFolder(true);

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

          if (
            destinationFolderId
          ) {
            formData.append(
              "parentFolderId",
              destinationFolderId
            );
          }

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
            response.data
              ?.uploaded?.files ??
            droppedEntries.length;

          const uploadedFolders =
            response.data
              ?.uploaded?.folders ??
            0;

          setMessage(
            `Drop upload complete. ${uploadedFiles} file${
              uploadedFiles === 1
                ? ""
                : "s"
            } and ${uploadedFolders} folder${
              uploadedFolders === 1
                ? ""
                : "s"
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

                  if (
                    destinationFolderId
                  ) {
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

          setMessage(
            `${uploadedCount} dropped file${
              uploadedCount === 1
                ? ""
                : "s"
            } uploaded successfully.`
          );

          if (
            failed.length > 0
          ) {
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

        await refreshCurrentDriveAfterDrop();
      } catch (err) {
        console.error(
          "Drop upload error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            err.message ||
            "Unable to upload dropped items."
        );
      } finally {
        setUploading(false);
        setUploadingFolder(false);
      }
    };

  const moveDroppedDriveItems =
    async (
      droppedItems,
      destinationFolderId = null
    ) => {
      if (
        !Array.isArray(
          droppedItems
        ) ||
        droppedItems.length === 0
      ) {
        return;
      }

      const destinationKey =
        destinationFolderId === null
          ? null
          : String(
              destinationFolderId
            );

      const validItems =
        droppedItems.filter(
          (entry) => {
            if (
              entry.resourceType !==
              "folder"
            ) {
              return true;
            }

            // Never move a folder into itself.
            return (
              String(entry.id) !==
              destinationKey
            );
          }
        );

      if (
        validItems.length === 0
      ) {
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
            validItems.map(
              (entry) => {
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

        if (
          movedCount > 0
        ) {
          setMessage(
            `${movedCount} item${
              movedCount === 1
                ? ""
                : "s"
            } moved successfully.`
          );
        }

        if (
          failed.length > 0
        ) {
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

        await refreshCurrentDriveAfterDrop();
      } catch (err) {
        console.error(
          "Drag move error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            err.message ||
            "Unable to move the dropped items."
        );
      } finally {
        setDragMoveCount(0);
        setFolderDropTargetId(null);
      }
    };

  const handleExternalDropToCurrentFolder =
    async (entries) => {
      await uploadDroppedEntries(
        entries,
        currentFolder
          ? currentFolder.id
          : null
      );
    };

  const handleInternalDropToCurrentFolder =
    async (items) => {
      await moveDroppedDriveItems(
        items,
        currentFolder
          ? currentFolder.id
          : null
      );
    };

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop,
  } = useDriveDragDrop({
    disabled:
      loading ||
      searching,
    onExternalDrop:
      handleExternalDropToCurrentFolder,
    onInternalDrop:
      handleInternalDropToCurrentFolder,
  });

  const getDraggedRecordsForItem =
    (
      resourceType,
      item
    ) => {
      const key =
        getSelectionKey(
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

  const handleItemDragStart =
    (
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
        setSelectedItems(
          records
        );
      }

      writeDriveDragPayload(
        event.dataTransfer,
        records
      );

      if (
        event.dataTransfer
      ) {
        event.dataTransfer.effectAllowed =
          "move";
      }
    };

  const handleItemDragEnd =
    () => {
      setFolderDropTargetId(null);
    };

  const handleFolderDropEnter =
    (folder, event) => {
      const canAccept =
        hasExternalFiles(
          event.dataTransfer
        ) ||
        hasDriveDragPayload(
          event.dataTransfer
        );

      if (!canAccept) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setFolderDropTargetId(
        String(folder.id)
      );
    };

  const handleFolderDropOver =
    (folder, event) => {
      const isExternal =
        hasExternalFiles(
          event.dataTransfer
        );

      const isInternal =
        hasDriveDragPayload(
          event.dataTransfer
        );

      if (
        !isExternal &&
        !isInternal
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setFolderDropTargetId(
        String(folder.id)
      );

      event.dataTransfer.dropEffect =
        isInternal
          ? "move"
          : "copy";
    };

  const handleFolderDropLeave =
    (folder, event) => {
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
        String(
          folderDropTargetId
        ) ===
        String(folder.id)
      ) {
        setFolderDropTargetId(
          null
        );
      }
    };

  const handleDropOnFolder =
    async (folder, event) => {
      const internalPayload =
        readDriveDragPayload(
          event.dataTransfer
        );

      const isExternal =
        hasExternalFiles(
          event.dataTransfer
        );

      if (
        !internalPayload &&
        !isExternal
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setFolderDropTargetId(
        null
      );

      if (
        internalPayload
      ) {
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
  // REFRESH
  // ======================================================

  const handleRefresh =
    async () => {
      setMessage("");
      setError("");

      if (
        isSearchMode ||
        searchTerm.trim() ||
        searchType !==
          "all"
      ) {
        await performSearch(
          searchTerm,
          searchType
        );

        return;
      }

      await loadDrive(
        currentFolder
          ? currentFolder.id
          : null
      );
    };

  // ======================================================
  // EMPTY STATE
  // ======================================================

  const noResults =
    !loading &&
    !searching &&
    folders.length === 0 &&
    documents.length === 0 &&
    spreadsheets.length ===
      0 &&
    presentations.length ===
      0 &&
    regularFiles.length ===
      0;

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="min-h-screen">

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

        <div className="flex min-h-[76px] items-center gap-4 px-6">

          <form
            onSubmit={
              handleSearchSubmit
            }
            className="flex flex-1 items-center gap-2"
          >

            <div className="relative max-w-3xl flex-1">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={
                  searchTerm
                }
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Search files and folders..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <button
                type="button"
                onClick={
                  handleClearSearch
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X
                  size={17}
                />
              </button>

            </div>

            <select
              value={
                searchType
              }
              onChange={
                handleSearchTypeChange
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
            >
              <option value="all">
                All types
              </option>

              <option value="folder">
                Folders
              </option>

              <option value="project">
                Projects
              </option>

              <option value="document">
                Cloud Documents
              </option>

              <option value="spreadsheet">
                Cloud Spreadsheets
              </option>

              <option value="presentation">
                Cloud Presentations
              </option>

              <option value="pdf">
                PDF
              </option>

              <option value="word">
                Word
              </option>

              <option value="excel">
                Excel
              </option>

              <option value="powerpoint">
                PowerPoint
              </option>

              <option value="image">
                Images
              </option>

              <option value="video">
                Videos
              </option>

              <option value="audio">
                Audio
              </option>

              <option value="archive">
                Archives
              </option>

              <option value="text">
                Text
              </option>

              <option value="code">
                Code
              </option>

              <option value="other">
                Other files
              </option>
            </select>

            <button
              type="submit"
              disabled={
                searching
              }
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            >
              {searching
                ? "Searching..."
                : "Search"}
            </button>

          </form>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={
                handleRefresh
              }
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-indigo-600"
            >
              <RefreshCw
                size={18}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/trash"
                )
              }
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-red-500"
            >
              <Trash2
                size={18}
              />
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              <LogOut
                size={17}
              />

              Logout
            </button>

          </div>

        </div>

      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main
        {...dropZoneProps}
        className="relative p-6 lg:p-8"
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
              ? currentFolder
                ? `Move to ${currentFolder.name}`
                : "Move to My Drive"
              : currentFolder
                ? `Upload to ${currentFolder.name}`
                : "Upload to My Drive"
          }
          description={
            isInternalDragActive
              ? "Drop here to move the selected Cloud Drive items into this location."
              : "Drop files or folders from your computer to upload them here."
          }
        />

        <div className="mx-auto max-w-[1600px]">

          {/* HEADER */}

          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                {currentFolder &&
                  !isSearchMode && (
                    <button
                      type="button"
                      onClick={
                        handleBack
                      }
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-indigo-600"
                    >
                      <ArrowLeft
                        size={21}
                      />
                    </button>
                  )}

                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  {isSearchMode
                    ? "Search Results"
                    : currentFolder
                      ? currentFolder.name
                      : "My Drive"}
                </h2>

              </div>

              {isSearchMode ? (
                <p className="mt-2 text-sm text-slate-500">
                  {folders.length +
                    files.length}{" "}
                  matching items
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">

                  <button
                    type="button"
                    onClick={
                      handleGoToRoot
                    }
                    className="hover:text-indigo-600"
                  >
                    My Drive
                  </button>

                  {folderHistory
                    .filter(
                      (folder) =>
                        folder.id !==
                        null
                    )
                    .map(
                      (folder) => (
                        <span
                          key={
                            folder.id
                          }
                          className="flex items-center gap-2"
                        >
                          <span>
                            /
                          </span>

                          <span>
                            {
                              folder.name
                            }
                          </span>
                        </span>
                      )
                    )}

                  {currentFolder && (
                    <>
                      <span>
                        /
                      </span>

                      <span className="font-medium text-slate-700">
                        {
                          currentFolder.name
                        }
                      </span>
                    </>
                  )}

                </div>
              )}

            </div>

            {!isSearchMode && (
              <div className="flex items-center gap-3">

                <ViewModeToggle
                  viewMode={
                    viewMode
                  }
                  onChange={
                    setViewMode
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowFolderModal(
                      true
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm"
                >
                  <FolderPlus
                    size={18}
                  />

                  New Folder
                </button>

                <button
                  type="button"
                  onClick={
                    handleUploadClick
                  }
                  disabled={
                    uploading ||
                    uploadingFolder
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  <Upload
                    size={18}
                  />

                  {uploading
                    ? "Uploading..."
                    : uploadingFolder
                      ? "Uploading folder..."
                      : "Upload File"}
                </button>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  onChange={
                    handleFileUpload
                  }
                  className="hidden"
                />

                <input
                  ref={
                    folderInputRef
                  }
                  type="file"
                  {...{
                    webkitdirectory:
                      "",
                    directory:
                      "",
                  }}
                  multiple
                  onChange={
                    handleFolderUpload
                  }
                  className="hidden"
                />

              </div>
            )}

          </div>

          {/* ==================================================
              MULTI-SELECT ACTION BAR
          ================================================== */}

          {selectedItems.length > 0 && (
            <div
              className={`relative mb-6 flex min-h-[64px] items-center gap-2 rounded-2xl border px-4 shadow-sm transition-colors ${
                isDark
                  ? "border-violet-500/30 bg-slate-800 text-slate-200"
                  : "border-violet-200 bg-violet-50 text-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={handleClearSelection}
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
                className={`mx-1 h-7 w-px ${
                  isDark
                    ? "bg-slate-600"
                    : "bg-violet-200"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowGeminiInfo(true)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "border-violet-500/30 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25"
                    : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                }`}
                title="Ask Gemini"
              >
                <Sparkles size={16} />
                Ask Gemini
              </button>

              <button type="button" onClick={handleShareSelected} className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isDark ? "text-slate-300 hover:bg-slate-700 hover:text-violet-300" : "text-slate-600 hover:bg-white hover:text-violet-600"}`} title="Share">
                <Users size={20} />
              </button>

              <button type="button" disabled={selectedItems.every((selected) => selected.resourceType !== "file")} onClick={handleDownloadSelected} className={`flex h-10 w-10 items-center justify-center rounded-xl transition disabled:cursor-not-allowed ${isDark ? "text-slate-300 hover:bg-slate-700 hover:text-blue-300 disabled:text-slate-600" : "text-slate-600 hover:bg-white hover:text-blue-600 disabled:text-slate-300"}`} title="Download">
                <Download size={20} />
              </button>

              <button type="button" onClick={handleOpenSelectedMove} className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isDark ? "text-slate-300 hover:bg-slate-700 hover:text-violet-300" : "text-slate-600 hover:bg-white hover:text-violet-600"}`} title="Move">
                <Move size={20} />
              </button>

              <button type="button" onClick={handleRequestBulkDelete} className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isDark ? "text-slate-300 hover:bg-red-500/15 hover:text-red-300" : "text-slate-600 hover:bg-red-50 hover:text-red-600"}`} title="Move to Trash">
                <Trash2 size={20} />
              </button>

              <button type="button" onClick={handleCopySelectedLink} className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isDark ? "text-slate-300 hover:bg-slate-700 hover:text-violet-300" : "text-slate-600 hover:bg-white hover:text-violet-600"}`} title="Copy link">
                <Link2 size={20} />
              </button>

              <div className="relative">
                <button type="button" onClick={() => setBulkMoreOpen((current) => !current)} className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isDark ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-600 hover:bg-white"}`} title="More actions">
                  <MoreVertical size={21} />
                </button>

                {bulkMoreOpen && (
                  <div className={`absolute left-0 top-12 z-[90] w-56 overflow-hidden rounded-2xl border py-2 shadow-2xl ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                    <button type="button" onClick={() => { setBulkMoreOpen(false); handleToggleSelectedStar(); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}>
                      <Star size={17} />
                      {selectedItems.some((selected) => !selected.item?.isStarred) ? "Add to starred" : "Remove from starred"}
                    </button>
                    <button type="button" onClick={() => { setBulkMoreOpen(false); handleOpenSelectedMove(); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}><Move size={17} />Move</button>
                    <button type="button" onClick={() => { setBulkMoreOpen(false); handleRequestBulkDelete(); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${isDark ? "text-red-300 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`}><Trash2 size={17} />Move to Trash</button>
                    <button type="button" onClick={() => { setBulkMoreOpen(false); handleClearSelection(); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}><X size={17} />Clear selection</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MESSAGES */}

          {message && (
            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* LOADING */}

          {(loading ||
            searching) && (
            <div className="rounded-3xl border border-slate-200 bg-white py-24 text-center shadow-sm">

              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-indigo-500"
              />

              <p className="mt-4 text-sm text-slate-500">
                {searching
                  ? "Searching..."
                  : "Loading your drive..."}
              </p>

            </div>
          )}

          {/* EMPTY */}

          {noResults && (
            <div className="rounded-3xl border border-slate-200 bg-white py-24 text-center shadow-sm">

              {isSearchMode ? (
                <>
                  <Search
                    size={45}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-5 text-lg font-semibold text-slate-700">
                    No results found
                  </h3>
                </>
              ) : (
                <>
                  <Folder
                    size={46}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-5 text-lg font-semibold text-slate-700">
                    {currentFolder
                      ? "This folder is empty"
                      : "Your drive is empty"}
                  </h3>
                </>
              )}

            </div>
          )}

          <div
            ref={
              selectionAreaRef
            }
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
                className={`pointer-events-none absolute z-[70] border ${isDark ? "border-violet-400 bg-violet-400/15" : "border-violet-500 bg-violet-300/25"}`}
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

          {/* ==================================================
              FOLDERS
          ================================================== */}

          {!loading &&
            !searching &&
            folders.length > 0 && (
              <FolderSection
                folders={folders}
                viewMode={viewMode}
                isSearchMode={isSearchMode}
                isDark={isDark}
                onOpen={handleOpenFolder}
                onRename={handleRenameFolder}
                onShare={handleOpenShareModal}
                onStar={handleToggleFolderStar}
                onTrash={handleTrashFolder}
                onDetails={handleShowDetails}
                onCopyLink={handleCopyLink}
                onMove={handleOpenMoveModal}
                isSelected={isItemSelected}
                onToggleSelect={handleToggleSelection}
                onItemDragStart={handleItemDragStart}
                onItemDragEnd={handleItemDragEnd}
                dropTargetId={folderDropTargetId}
                onFolderDragEnter={handleFolderDropEnter}
                onFolderDragOver={handleFolderDropOver}
                onFolderDragLeave={handleFolderDropLeave}
                onFolderDrop={handleDropOnFolder}
              />
            )}

          {/* ==================================================
              DOCUMENTS
          ================================================== */}

          {!loading &&
            !searching &&
            documents.length >
              0 && (
              <CloudSection
                title="Documents"
                searchTitle="Matching documents"
                description="Editable documents created in Cloud Drive"
                files={
                  documents
                }
                type="document"
                isSearchMode={
                  isSearchMode
                }
                isDark={isDark}
                onOpen={
                  handleOpenFile
                }
                onShare={
                  handleOpenShareModal
                }
                onRename={
                  handleRenameFile
                }
                onTrash={
                  handleTrashFile
                }
                onStar={
                  handleToggleFileStar
                }
                onDownload={
                  handleDownloadFile
                }
                onDetails={
                  handleShowDetails
                }
                onCopyLink={
                  handleCopyLink
                }
                onMove={
                  handleOpenMoveModal
                }
                viewMode={
                  viewMode
                }
                isSelected={
                  isItemSelected
                }
                onToggleSelect={
                  handleToggleSelection
                }
                onItemDragStart={
                  handleItemDragStart
                }
                onItemDragEnd={
                  handleItemDragEnd
                }
              />
            )}

          {/* ==================================================
              SPREADSHEETS
          ================================================== */}

          {!loading &&
            !searching &&
            spreadsheets.length >
              0 && (
              <CloudSection
                title="Spreadsheets"
                searchTitle="Matching spreadsheets"
                description="Editable spreadsheets created in Cloud Drive"
                files={
                  spreadsheets
                }
                type="spreadsheet"
                isSearchMode={
                  isSearchMode
                }
                isDark={isDark}
                onOpen={
                  handleOpenFile
                }
                onShare={
                  handleOpenShareModal
                }
                onRename={
                  handleRenameFile
                }
                onTrash={
                  handleTrashFile
                }
                onStar={
                  handleToggleFileStar
                }
                onDownload={
                  handleDownloadFile
                }
                onDetails={
                  handleShowDetails
                }
                onCopyLink={
                  handleCopyLink
                }
                onMove={
                  handleOpenMoveModal
                }
                viewMode={
                  viewMode
                }
                isSelected={
                  isItemSelected
                }
                onToggleSelect={
                  handleToggleSelection
                }
                onItemDragStart={
                  handleItemDragStart
                }
                onItemDragEnd={
                  handleItemDragEnd
                }
              />
            )}

          {/* ==================================================
              PRESENTATIONS
          ================================================== */}

          {!loading &&
            !searching &&
            presentations.length >
              0 && (
              <CloudSection
                title="Presentations"
                searchTitle="Matching presentations"
                description="Editable presentations created in Cloud Drive"
                files={
                  presentations
                }
                type="presentation"
                isSearchMode={
                  isSearchMode
                }
                isDark={isDark}
                onOpen={
                  handleOpenFile
                }
                onShare={
                  handleOpenShareModal
                }
                onRename={
                  handleRenameFile
                }
                onTrash={
                  handleTrashFile
                }
                onStar={
                  handleToggleFileStar
                }
                onDownload={
                  handleDownloadFile
                }
                onDetails={
                  handleShowDetails
                }
                onCopyLink={
                  handleCopyLink
                }
                onMove={
                  handleOpenMoveModal
                }
                viewMode={
                  viewMode
                }
                isSelected={
                  isItemSelected
                }
                onToggleSelect={
                  handleToggleSelection
                }
                onItemDragStart={
                  handleItemDragStart
                }
                onItemDragEnd={
                  handleItemDragEnd
                }
              />
            )}

          {/* ==================================================
              REGULAR FILES
          ================================================== */}

          {!loading &&
            !searching &&
            regularFiles.length >
              0 && (
              <RegularFileSection
                files={
                  regularFiles
                }
                isSearchMode={
                  isSearchMode
                }
                isDark={isDark}
                onOpen={
                  handlePreviewFile
                }
                onShare={
                  handleOpenShareModal
                }
                onRename={
                  handleRenameFile
                }
                onTrash={
                  handleTrashFile
                }
                onStar={
                  handleToggleFileStar
                }
                onDownload={
                  handleDownloadFile
                }
                onDetails={
                  handleShowDetails
                }
                onCopyLink={
                  handleCopyLink
                }
                onMove={
                  handleOpenMoveModal
                }
                viewMode={
                  viewMode
                }
                isSelected={
                  isItemSelected
                }
                onToggleSelect={
                  handleToggleSelection
                }
                onItemDragStart={
                  handleItemDragStart
                }
                onItemDragEnd={
                  handleItemDragEnd
                }
              />
            )}


          </div>

        </div>

      </main>

      {/* ==================================================
          TEMPLATE GALLERY MODAL
      ================================================== */}

      {templateGalleryType && (
        <TemplateGalleryModal
          type={
            templateGalleryType
          }
          onClose={
            handleCloseTemplateGallery
          }
          onSelectTemplate={
            handleSelectTemplate
          }
        />
      )}

      {/* ==================================================
          CREATE DOCUMENT MODAL
      ================================================== */}

      {showDocumentModal && (
        <CreateItemModal
          type="document"
          title="New document"
          description="Create an editable Cloud Drive document."
          value={
            documentName
          }
          onChange={
            setDocumentName
          }
          placeholder="e.g. Project Notes"
          currentFolder={
            currentFolder
          }
          loading={
            creatingDocument
          }
          selectedTemplate={
            null
          }
          onClose={() => {
            setShowDocumentModal(
              false
            );

            setDocumentName(
              ""
            );
          }}
          onSubmit={
            handleCreateDocument
          }
        />
      )}

      {/* ==================================================
          CREATE SPREADSHEET MODAL
      ================================================== */}

      {showSpreadsheetModal && (
        <CreateItemModal
          type="spreadsheet"
          title={
            selectedTemplate
              ? "Create from template"
              : "New spreadsheet"
          }
          description={
            selectedTemplate
              ? `Using the "${selectedTemplate.name}" template.`
              : "Create an editable Cloud Drive spreadsheet."
          }
          value={
            spreadsheetName
          }
          onChange={
            setSpreadsheetName
          }
          placeholder="e.g. Project Data"
          currentFolder={
            currentFolder
          }
          loading={
            creatingSpreadsheet
          }
          selectedTemplate={
            selectedTemplate
          }
          onClose={() => {
            setShowSpreadsheetModal(
              false
            );

            setSpreadsheetName(
              ""
            );

            setSelectedTemplate(
              null
            );
          }}
          onSubmit={
            handleCreateSpreadsheet
          }
        />
      )}

      {/* ==================================================
          CREATE PRESENTATION MODAL
      ================================================== */}

      {showPresentationModal && (
        <CreateItemModal
          type="presentation"
          title={
            selectedTemplate
              ? "Create from template"
              : "New presentation"
          }
          description={
            selectedTemplate
              ? `Using the "${selectedTemplate.name}" template.`
              : "Create an editable Cloud Drive presentation."
          }
          value={
            presentationName
          }
          onChange={
            setPresentationName
          }
          placeholder="e.g. Project Presentation"
          currentFolder={
            currentFolder
          }
          loading={
            creatingPresentation
          }
          selectedTemplate={
            selectedTemplate
          }
          onClose={() => {
            setShowPresentationModal(
              false
            );

            setPresentationName(
              ""
            );

            setSelectedTemplate(
              null
            );
          }}
          onSubmit={
            handleCreatePresentation
          }
        />
      )}

      {/* ==================================================
          CREATE FOLDER MODAL
      ================================================== */}

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Create folder
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Add a new folder to your drive.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowFolderModal(
                    false
                  );

                  setFolderName(
                    ""
                  );
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X
                  size={19}
                />
              </button>

            </div>

            <form
              onSubmit={
                handleCreateFolder
              }
            >

              <input
                autoFocus
                value={
                  folderName
                }
                onChange={(e) =>
                  setFolderName(
                    e.target.value
                  )
                }
                placeholder="Folder name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(
                      false
                    );

                    setFolderName(
                      ""
                    );
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingFolder ||
                    !folderName.trim()
                  }
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {creatingFolder
                    ? "Creating..."
                    : "Create Folder"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          CREATE PROJECT MODAL
      ================================================== */}

      {showProjectModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-violet-600">

                    <FilePlus2
                      size={24}
                    />

                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      Create new project
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Start with an organized workspace for your files.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  disabled={
                    creatingProject
                  }
                  onClick={() => {
                    setShowProjectModal(
                      false
                    );

                    setProjectName(
                      ""
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X
                    size={20}
                  />
                </button>

              </div>

            </div>

            <form
              onSubmit={
                handleCreateProject
              }
              className="p-6"
            >

              <label className="text-sm font-semibold text-slate-700">
                Project name
              </label>

              <input
                autoFocus
                value={
                  projectName
                }
                onChange={(e) =>
                  setProjectName(
                    e.target.value
                  )
                }
                placeholder="e.g. BioNova Research"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-500">
                  Project structure
                </p>

                <div className="mt-4 space-y-2.5 text-sm">

                  <div className="flex items-center gap-2 font-semibold text-slate-700">

                    <Folder
                      size={17}
                      className="text-violet-500"
                    />

                    <span>
                      {projectName.trim() ||
                        "Project Name"}
                    </span>

                  </div>

                  <ProjectFolderRow
                    name="Documents"
                  />

                  <ProjectFolderRow
                    name="Assets"
                  />

                  <ProjectFolderRow
                    name="Data"
                  />

                  <ProjectFolderRow
                    name="Notes"
                  />

                </div>

              </div>

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  disabled={
                    creatingProject
                  }
                  onClick={() => {
                    setShowProjectModal(
                      false
                    );

                    setProjectName(
                      ""
                    );
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingProject ||
                    !projectName.trim()
                  }
                  className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >

                  {creatingProject ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <FilePlus2
                        size={17}
                      />

                      Create Project
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          SHARE MANAGEMENT MODAL
      ================================================== */}

      {showShareModal &&
        shareTarget && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

            <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">

                    <Share2
                      size={21}
                    />

                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      Share{" "}
                      {
                        shareTarget.resourceType
                      }
                    </h2>

                    <p className="mt-1 max-w-[350px] truncate text-sm text-slate-400">
                      {getItemDisplayName(
                        shareTarget.item
                      )}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseShareModal
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={20}
                  />
                </button>

              </div>

              <div className="p-6">

                <form
                  onSubmit={
                    handleShareItem
                  }
                >

                  <h3 className="mb-4 font-semibold text-slate-800">
                    Add people
                  </h3>

                  <div className="relative">

                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={
                        shareEmail
                      }
                      onChange={(e) => {
                        setShareEmail(
                          e.target.value
                        );

                        setShareError(
                          ""
                        );

                        setShareSuccess(
                          ""
                        );
                      }}
                      placeholder="Enter registered user's email"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />

                  </div>

                  <div className="mt-4 flex gap-3">

                    <select
                      value={
                        sharePermission
                      }
                      onChange={(e) =>
                        setSharePermission(
                          e.target.value
                        )
                      }
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    >
                      <option value="viewer">
                        Viewer
                      </option>

                      <option value="editor">
                        Editor
                      </option>
                    </select>

                    <button
                      type="submit"
                      disabled={
                        sharing ||
                        !shareEmail.trim()
                      }
                      className="flex min-w-[110px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                    >

                      <Share2
                        size={16}
                      />

                      {sharing
                        ? "Sharing..."
                        : "Share"}
                    </button>

                  </div>

                </form>

                {shareSuccess && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {
                      shareSuccess
                    }
                  </div>
                )}

                {shareError && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {
                      shareError
                    }
                  </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-6">

                  <div className="mb-4 flex items-center gap-2">

                    <Users
                      size={18}
                      className="text-violet-500"
                    />

                    <h3 className="font-semibold text-slate-800">
                      People with access
                    </h3>

                    {!loadingShares && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {
                          existingShares.length
                        }
                      </span>
                    )}

                  </div>

                  {loadingShares ? (
                    <div className="py-8 text-center">

                      <RefreshCw
                        size={23}
                        className="mx-auto animate-spin text-violet-500"
                      />

                      <p className="mt-3 text-sm text-slate-400">
                        Loading access...
                      </p>

                    </div>
                  ) : existingShares.length ===
                    0 ? (
                    <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">

                      <Users
                        size={30}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm font-medium text-slate-500">
                        Not shared with anyone yet
                      </p>

                    </div>
                  ) : (
                    <div className="space-y-3">

                      {existingShares.map(
                        (share) => (
                          <div
                            key={
                              share.id
                            }
                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div className="min-w-0">

                              <p className="truncate font-semibold text-slate-800">
                                {share.user
                                  ?.name ||
                                  "Cloud Drive user"}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-400">
                                {
                                  share.user
                                    ?.email
                                }
                              </p>

                            </div>

                            <div className="flex items-center gap-2">

                              <select
                                value={
                                  share.permission
                                }
                                disabled={
                                  updatingShareId ===
                                  share.id
                                }
                                onChange={(e) =>
                                  handleUpdateSharePermission(
                                    share.id,
                                    e.target.value
                                  )
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold capitalize text-slate-600 outline-none"
                              >
                                <option value="viewer">
                                  Viewer
                                </option>

                                <option value="editor">
                                  Editor
                                </option>
                              </select>

                              <button
                                type="button"
                                disabled={
                                  revokingShareId ===
                                  share.id
                                }
                                onClick={() =>
                                  handleRevokeShare(
                                    share
                                  )
                                }
                                className="flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2
                                  size={14}
                                />

                                {revokingShareId ===
                                share.id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

                <div className="mt-7 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      handleCloseShareModal
                    }
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Done
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      {/* ==================================================
          MOVE ITEM MODAL
      ================================================== */}

      {moveTarget && (
        <MoveItemModal
          target={
            moveTarget
          }
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
            moveFolderHistory.length >
              0
          }
          loading={
            loadingMoveFolders
          }
          moving={
            movingItem
          }
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
            if (movingItem) {
              return;
            }

            setMoveTarget(
              null
            );

            setMoveBrowserFolder(
              null
            );

            setMoveFolderHistory(
              []
            );

            setMoveFolders(
              []
            );
          }}
        />
      )}

      {/* ==================================================
          BULK SHARE MODAL
      ================================================== */}

      {showBulkShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Share {selectedItems.length} selected items
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Give the same person access to every selected item.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  bulkSharing
                }
                onClick={() =>
                  setShowBulkShareModal(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmitBulkShare
              }
              className="p-6"
            >

              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                autoFocus
                value={
                  bulkShareEmail
                }
                onChange={(event) =>
                  setBulkShareEmail(
                    event.target.value
                  )
                }
                placeholder="user@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Permission
              </label>

              <select
                value={
                  bulkSharePermission
                }
                onChange={(event) =>
                  setBulkSharePermission(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              >
                <option value="viewer">
                  Viewer
                </option>

                <option value="editor">
                  Editor
                </option>
              </select>

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  disabled={
                    bulkSharing
                  }
                  onClick={() =>
                    setShowBulkShareModal(
                      false
                    )
                  }
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    bulkSharing ||
                    !bulkShareEmail.trim()
                  }
                  className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {bulkSharing ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />

                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2
                        size={16}
                      />

                      Share
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
    ASK GEMINI MODAL
================================================== */}

{showGeminiInfo && (
  <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

    <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

      {/* HEADER */}

      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Sparkles
              size={23}
            />
          </div>

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Ask Gemini
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Ask questions about the selected files and folders.
            </p>

            <p className="mt-2 text-xs font-semibold text-violet-600">
              {selectedItems.length} item
              {selectedItems.length === 1 ? "" : "s"} selected
            </p>

          </div>

        </div>

        <button
          type="button"
          disabled={geminiLoading}
          onClick={() => {
            setShowGeminiInfo(false);
            setGeminiQuestion("");
            setGeminiResponse("");
            setGeminiError("");
          }}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X
            size={20}
          />
        </button>

      </div>

      {/* BODY */}

      <div className="overflow-y-auto p-6">

        {/* QUICK PROMPTS */}

        <div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Quick prompts
          </p>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              disabled={geminiLoading}
              onClick={() => {
                const question =
                  "Summarize the selected items.";

                setGeminiQuestion(question);

                handleAskGemini(question);
              }}
              className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
            >
              Summarize
            </button>

            <button
              type="button"
              disabled={geminiLoading}
              onClick={() => {
                const question =
                  "Compare the selected items and explain the main differences.";

                setGeminiQuestion(question);

                handleAskGemini(question);
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Compare
            </button>

            <button
              type="button"
              disabled={geminiLoading}
              onClick={() => {
                const question =
                  "Give me the key action items based on the selected items.";

                setGeminiQuestion(question);

                handleAskGemini(question);
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Action items
            </button>

          </div>

        </div>

        {/* QUESTION */}

        <div className="mt-6">

          <label className="text-sm font-semibold text-slate-700">
            Ask a question
          </label>

          <textarea
            value={geminiQuestion}
            onChange={(event) => {
              setGeminiQuestion(
                event.target.value
              );

              setGeminiError("");
            }}
            disabled={geminiLoading}
            placeholder="e.g. What are these selected files about?"
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
          />

          <div className="mt-3 flex justify-end">

            <button
              type="button"
              disabled={
                geminiLoading ||
                !geminiQuestion.trim() ||
                selectedItems.length === 0
              }
              onClick={() =>
                handleAskGemini()
              }
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {geminiLoading ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles
                    size={16}
                  />

                  Ask Gemini
                </>
              )}

            </button>

          </div>

        </div>

        {/* ERROR */}

        {geminiError && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {geminiError}
          </div>
        )}

        {/* RESPONSE */}

        {geminiResponse && (
          <div className="mt-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5">

            <div className="mb-4 flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                <Sparkles
                  size={16}
                />
              </div>

              <p className="font-bold text-slate-800">
                Gemini response
              </p>

            </div>

            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {geminiResponse}
            </div>

          </div>
        )}

        {/* INITIAL HELPER */}

        {!geminiResponse &&
          !geminiLoading &&
          !geminiError && (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5">

              <p className="text-sm font-semibold text-slate-700">
                What can I ask?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Try asking for a summary, comparison, file organization advice,
                key dates, or information about the selected files and folders.
              </p>

            </div>
          )}

      </div>

      {/* FOOTER */}

      <div className="flex justify-end border-t border-slate-100 px-6 py-4">

        <button
          type="button"
          disabled={geminiLoading}
          onClick={() => {
            setShowGeminiInfo(false);
            setGeminiQuestion("");
            setGeminiResponse("");
            setGeminiError("");
          }}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}

      {/* ==================================================
          BULK DELETE CONFIRMATION
      ================================================== */}

      {showBulkDeleteConfirm && (
        <BulkDeleteConfirmModal
          items={
            selectedItems
          }
          deleting={
            bulkDeleting
          }
          onCancel={() => {
            if (
              bulkDeleting
            ) {
              return;
            }

            setShowBulkDeleteConfirm(
              false
            );
          }}
          onConfirm={
            handleConfirmBulkDelete
          }
        />
      )}

      {/* ==================================================
          FILE PREVIEW MODAL
      ================================================== */}

      {previewFile && (
        <DrivePreviewModal
          file={previewFile}
          isDark={isDark}
          onClose={() =>
            setPreviewFile(
              null
            )
          }
          onDownload={
            handleDownloadFile
          }
        />
      )}

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {detailsTarget && (
        <ItemDetailsModal
          target={
            detailsTarget
          }
          onClose={() =>
            setDetailsTarget(
              null
            )
          }
        />
      )}

    </div>
  );
}

// ======================================================
// MOVE ITEM MODAL
// ======================================================

function MoveItemModal({
  target,
  currentFolder,
  folders,
  canGoBack,
  loading,
  moving,
  onBrowse,
  onBack,
  onMove,
  onClose,
}) {
  const displayName =
    target?.resourceType ===
    "bulk"
      ? `${target.items?.length || 0} selected items`
      : getItemDisplayName(
          target?.item
        );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Move {displayName}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Choose the destination folder.
            </p>
          </div>

          <button
            type="button"
            disabled={moving}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
              <Folder
                size={18}
                className="shrink-0 text-violet-500"
              />

              <span className="truncate text-sm font-semibold text-slate-700">
                {currentFolder
                  ? currentFolder.name
                  : "My Drive"}
              </span>
            </div>
          </div>

          <div className="max-h-[330px] min-h-[220px] overflow-y-auto rounded-2xl border border-slate-200">

            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="text-center">
                  <RefreshCw
                    size={24}
                    className="mx-auto animate-spin text-violet-500"
                  />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading folders...
                  </p>
                </div>
              </div>
            ) : folders.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center px-6 text-center">
                <div>
                  <Folder
                    size={34}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No folders inside this location
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() =>
                      onBrowse(folder)
                    }
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-violet-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                      <Folder size={20} />
                    </div>

                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                      {folder.name}
                    </span>

                    <ChevronRight
                      size={18}
                      className="text-slate-300"
                    />
                  </button>
                ))}
              </div>
            )}

          </div>

          <p className="mt-4 text-xs text-slate-400">
            Current destination: {currentFolder
              ? currentFolder.name
              : "My Drive"}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={moving}
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={moving || loading}
              onClick={onMove}
              className="flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
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
// VIEW MODE TOGGLE
// ======================================================

function ViewModeToggle({
  viewMode,
  onChange,
}) {
  return (
    <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1 shadow-sm">

      <button
        type="button"
        onClick={() =>
          onChange(
            "list"
          )
        }
        title="List view"
        className={`flex h-9 w-11 items-center justify-center rounded-lg transition ${
          viewMode ===
          "list"
            ? "bg-indigo-50 text-indigo-600"
            : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        {viewMode ===
          "list" && (
          <Check
            size={14}
            className="mr-1"
          />
        )}

        <List
          size={18}
        />
      </button>

      <button
        type="button"
        onClick={() =>
          onChange(
            "grid"
          )
        }
        title="Grid view"
        className={`flex h-9 w-11 items-center justify-center rounded-lg transition ${
          viewMode ===
          "grid"
            ? "bg-indigo-50 text-indigo-600"
            : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        {viewMode ===
          "grid" && (
          <Check
            size={14}
            className="mr-1"
          />
        )}

        <Grid2X2
          size={18}
        />
      </button>

    </div>
  );
}

// ======================================================
// LIST HEADER
// ======================================================

function DriveListHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_150px_150px_100px_44px] items-center border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">

      <span>
        Name
      </span>

      <span>
        Type
      </span>

      <span>
        Modified
      </span>

      <span>
        Size
      </span>

      <span />

    </div>
  );
}

// ======================================================
// ITEM ACTION MENU
// ======================================================

function ItemActionMenu({
  resourceType,
  item,
  onOpen,
  onDownload,
  onShare,
  onRename,
  onStar,
  onTrash,
  onDetails,
  onCopyLink,
  onMove,
}) {
  const menuRef =
    useRef(null);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    submenu,
    setSubmenu,
  ] = useState(null);

  const isFolder =
    resourceType ===
    "folder";

  useEffect(() => {
    const handleOutside =
      (event) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {
          setOpen(false);
          setSubmenu(null);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  const closeMenu =
    () => {
      setOpen(false);
      setSubmenu(null);
    };

  return (
    <div
      ref={
        menuRef
      }
      className="relative"
    >

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();

          setOpen(
            (current) =>
              !current
          );

          setSubmenu(
            null
          );
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        title="More actions"
      >
        <MoreVertical
          size={20}
        />
      </button>

      {open && (
        <div
          onClick={(event) =>
            event.stopPropagation()
          }
          className="absolute right-0 top-11 z-[80] w-64 overflow-visible rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl"
        >

          <MenuAction
            icon={
              FileText
            }
            label="Open"
            onClick={() => {
              onOpen(
                item
              );

              closeMenu();
            }}
          />

          {!isFolder &&
            onDownload && (
              <MenuAction
                icon={
                  Download
                }
                label="Download"
                onClick={() => {
                  onDownload(
                    item
                  );

                  closeMenu();
                }}
              />
            )}

          <MenuAction
            icon={
              Pencil
            }
            label="Rename"
            onClick={() => {
              onRename(
                item
              );

              closeMenu();
            }}
          />

          <div className="my-2 border-t border-slate-100" />

          <div className="relative">

            <MenuAction
              icon={
                Share2
              }
              label="Share"
              rightIcon={
                ChevronRight
              }
              active={
                submenu ===
                "share"
              }
              onMouseEnter={() =>
                setSubmenu(
                  "share"
                )
              }
              onClick={() =>
                setSubmenu(
                  submenu ===
                    "share"
                    ? null
                    : "share"
                )
              }
            />

            {submenu ===
              "share" && (
              <div className="absolute right-full top-0 mr-2 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl">

                <MenuAction
                  icon={
                    Share2
                  }
                  label="Share"
                  onClick={() => {
                    onShare(
                      resourceType,
                      item
                    );

                    closeMenu();
                  }}
                />

                <MenuAction
                  icon={
                    Link2
                  }
                  label="Copy link"
                  onClick={() => {
                    onCopyLink?.(
                      resourceType,
                      item
                    );

                    closeMenu();
                  }}
                />

              </div>
            )}

          </div>

          <div className="relative">

            <MenuAction
              icon={
                Folder
              }
              label="Organise"
              rightIcon={
                ChevronRight
              }
              active={
                submenu ===
                "organise"
              }
              onMouseEnter={() =>
                setSubmenu(
                  "organise"
                )
              }
              onClick={() =>
                setSubmenu(
                  submenu ===
                    "organise"
                    ? null
                    : "organise"
                )
              }
            />

            {submenu ===
              "organise" && (
              <div className="absolute right-full top-0 mr-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl">

                <MenuAction
                  icon={
                    Move
                  }
                  label="Move"
                  onClick={() => {
                    onMove?.(
                      resourceType,
                      item
                    );

                    closeMenu();
                  }}
                />

                <MenuAction
                  icon={
                    Star
                  }
                  label={
                    item.isStarred
                      ? "Remove from starred"
                      : "Add to starred"
                  }
                  onClick={() => {
                    onStar(
                      item
                    );

                    closeMenu();
                  }}
                />

              </div>
            )}

          </div>

          <MenuAction
            icon={
              Info
            }
            label={
              isFolder
                ? "Folder information"
                : "File information"
            }
            onClick={() => {
              onDetails(
                resourceType,
                item
              );

              closeMenu();
            }}
          />

          <div className="my-2 border-t border-slate-100" />

          <MenuAction
            icon={
              Trash2
            }
            label="Move to Trash"
            danger
            onClick={() => {
              onTrash(
                item
              );

              closeMenu();
            }}
          />

        </div>
      )}

    </div>
  );
}

// ======================================================
// MENU ACTION
// ======================================================

function MenuAction({
  icon: Icon,
  label,
  onClick,
  onMouseEnter,
  rightIcon: RightIcon,
  active = false,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      onMouseEnter={
        onMouseEnter
      }
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
        disabled
          ? "cursor-not-allowed text-slate-300"
          : danger
            ? "text-red-500 hover:bg-red-50"
            : active
              ? "bg-slate-100 text-slate-900"
              : "text-slate-700 hover:bg-slate-100"
      }`}
    >

      <Icon
        size={18}
        className="shrink-0"
      />

      <span className="min-w-0 flex-1 truncate">
        {
          label
        }
      </span>

      {RightIcon && (
        <RightIcon
          size={16}
          className="shrink-0"
        />
      )}

    </button>
  );
}

// ======================================================
// FOLDER SECTION
// ======================================================

function FolderSection({
  folders,
  viewMode,
  isSearchMode,
  isDark,
  onOpen,
  onRename,
  onShare,
  onStar,
  onTrash,
  onDetails,
  onCopyLink,
  onMove,
  isSelected,
  onToggleSelect,
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

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          {isSearchMode
            ? "Matching folders"
            : "Folders"}
        </h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
          {folders.length}
        </span>

      </div>

      {viewMode === "list" ? (
        <div className={`overflow-visible rounded-2xl border shadow-sm ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>

          <DriveListHeader />

          {folders.map(
            (folder) => {
              const selected =
                isSelected(
                  "folder",
                  folder
                );

              return (
                <div
                  key={
                    folder.id
                  }
                  data-selectable-item="true"
                  data-selection-key={`folder:${folder.id}`}
                  draggable
                  onDragStart={(event) =>
                    onItemDragStart(
                      "folder",
                      folder,
                      event
                    )
                  }
                  onDragEnd={onItemDragEnd}
                  onDragEnter={(event) =>
                    onFolderDragEnter(
                      folder,
                      event
                    )
                  }
                  onDragOver={(event) =>
                    onFolderDragOver(
                      folder,
                      event
                    )
                  }
                  onDragLeave={(event) =>
                    onFolderDragLeave(
                      folder,
                      event
                    )
                  }
                  onDrop={(event) =>
                    onFolderDrop(
                      folder,
                      event
                    )
                  }
                  onDoubleClick={() =>
                    onOpen(
                      folder
                    )
                  }
                  className={`grid grid-cols-[minmax(0,1fr)_150px_150px_100px_44px] items-center border-b px-4 py-3 transition last:border-b-0 ${
                    isDark ? "border-slate-800" : "border-slate-100"
                  } ${
                    String(dropTargetId) === String(folder.id)
                      ? isDark
                        ? "bg-violet-500/20 ring-2 ring-inset ring-violet-400/70"
                        : "bg-violet-100 ring-2 ring-inset ring-violet-400"
                      : selected
                        ? isDark
                          ? "bg-violet-500/15 ring-1 ring-inset ring-violet-400/40"
                          : "bg-violet-50 ring-1 ring-inset ring-violet-200"
                        : isDark
                          ? "bg-slate-900 hover:bg-slate-800/80"
                          : "hover:bg-indigo-50/50"
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <SelectionCheckbox
                      selected={
                        selected
                      }
                      onClick={() =>
                        onToggleSelect(
                          "folder",
                          folder
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        onOpen(
                          folder
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >

                      {(() => {
                        const config =
                          getItemTypeConfig(
                            folder,
                            "folder"
                          );

                        const Icon =
                          config.icon;

                        return (
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.iconBoxClass}`}
                          >
                            <Icon
                              size={20}
                            />
                          </div>
                        );
                      })()}

                      <span className={`truncate font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {
                          folder.name
                        }
                      </span>

                      {folder.isStarred && (
                        <Star
                          size={15}
                          className="shrink-0 fill-amber-400 text-amber-400"
                        />
                      )}

                    </button>

                  </div>

                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {getItemTypeConfig(
                      folder,
                      "folder"
                    ).label}
                  </span>

                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {formatModifiedDate(
                      folder.updatedAt ||
                      folder.updated_at ||
                      folder.createdAt ||
                      folder.created_at
                    )}
                  </span>

                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {formatFileSize(
                        folder.sizeBytes
                    )}
                    </span>

                  <ItemActionMenu
                    resourceType="folder"
                    item={
                      folder
                    }
                    onOpen={
                      onOpen
                    }
                    onShare={
                      onShare
                    }
                    onRename={
                      onRename
                    }
                    onStar={
                      onStar
                    }
                    onTrash={
                      onTrash
                    }
                    onDetails={
                      onDetails
                    }
                    onCopyLink={
                      onCopyLink
                    }
                    onMove={
                      onMove
                    }
                  />

                </div>
              );
            }
          )}

        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

          {folders.map(
            (folder) => {
              const selected =
                isSelected(
                  "folder",
                  folder
                );

              return (
                <div
                  key={
                    folder.id
                  }
                  data-selectable-item="true"
                  data-selection-key={`folder:${folder.id}`}
                  draggable
                  onDragStart={(event) =>
                    onItemDragStart(
                      "folder",
                      folder,
                      event
                    )
                  }
                  onDragEnd={onItemDragEnd}
                  onDragEnter={(event) =>
                    onFolderDragEnter(
                      folder,
                      event
                    )
                  }
                  onDragOver={(event) =>
                    onFolderDragOver(
                      folder,
                      event
                    )
                  }
                  onDragLeave={(event) =>
                    onFolderDragLeave(
                      folder,
                      event
                    )
                  }
                  onDrop={(event) =>
                    onFolderDrop(
                      folder,
                      event
                    )
                  }
                  className={`group relative rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    String(dropTargetId) === String(folder.id)
                      ? isDark
                        ? "border-violet-300 bg-violet-500/20 ring-4 ring-violet-500/30"
                        : "border-violet-500 bg-violet-100 ring-4 ring-violet-200"
                      : selected
                        ? isDark
                          ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25"
                          : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                        : isDark
                          ? "border-slate-800 bg-slate-900 hover:border-violet-500/40 hover:bg-slate-800/80"
                          : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >

                  <div className="absolute left-3 top-3 z-20">
                    <SelectionCheckbox
                      selected={
                        selected
                      }
                      onClick={() =>
                        onToggleSelect(
                          "folder",
                          folder
                        )
                      }
                    />
                  </div>

                  <div className="absolute right-3 top-3 z-20">
                    <ItemActionMenu
                      resourceType="folder"
                      item={
                        folder
                      }
                      onOpen={
                        onOpen
                      }
                      onShare={
                        onShare
                      }
                      onRename={
                        onRename
                      }
                      onStar={
                        onStar
                      }
                      onTrash={
                        onTrash
                      }
                      onDetails={
                        onDetails
                      }
                      onCopyLink={
                        onCopyLink
                      }
                      onMove={
                        onMove
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onDoubleClick={() =>
                      onOpen(
                        folder
                      )
                    }
                    onClick={() =>
                      onOpen(
                        folder
                      )
                    }
                    className="w-full cursor-pointer text-left"
                  >

                    {(() => {
                      const config =
                        getItemTypeConfig(
                          folder,
                          "folder"
                        );

                      const Icon =
                        config.icon;

                      return (
                        <div
                          className={`mb-5 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br ${config.previewClass}`}
                        >
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ${config.iconClass}`}
                          >
                            <Icon
                              size={36}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex min-w-0 items-center gap-2 pr-8">

                      <p className={`min-w-0 flex-1 truncate font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {
                          folder.name
                        }
                      </p>

                      {folder.isStarred && (
                        <Star
                          size={16}
                          className="shrink-0 fill-amber-400 text-amber-400"
                        />
                      )}

                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
  <span
    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
      getItemTypeConfig(
        folder,
        "folder"
      ).badgeClass
    }`}
  >
    {getItemTypeConfig(
      folder,
      "folder"
    ).label}
  </span>

  <span className="text-xs text-slate-400">
    {formatFileSize(
      folder.sizeBytes
    )}
  </span>
</div>

                  </button>

                </div>
              );
            }
          )}

        </div>
      )}

    </section>
  );
}

// ======================================================
// CLOUD SECTION
// ======================================================

function CloudSection({
  title,
  searchTitle,
  description,
  files,
  type,
  isSearchMode,
  isDark,
  onOpen,
  onShare,
  onRename,
  onTrash,
  onStar,
  onDownload,
  onDetails,
  onCopyLink,
  onMove,
  viewMode,
  isSelected,
  onToggleSelect,
  onItemDragStart,
  onItemDragEnd,
}) {
  const config =
    getCloudTypeConfig(
      type
    );

  return (
    <section className="mb-10">

      <div className="mb-4 flex items-center justify-between">

        <div>

          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            {isSearchMode
              ? searchTitle
              : title}
          </h3>

          {!isSearchMode && (
            <p className="mt-1 text-xs text-slate-400">
              {
                description
              }
            </p>
          )}

        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.countClass}`}
        >
          {
            files.length
          }
        </span>

      </div>

      {viewMode === "list" ? (
        <div className={`overflow-visible rounded-2xl border shadow-sm ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>

          <DriveListHeader />

          {files.map(
            (file) => (
              <CloudFileListRow
                key={
                  file.id
                }
                file={
                  file
                }
                type={
                  type
                }
                isDark={isDark}
                onOpen={
                  onOpen
                }
                onShare={
                  onShare
                }
                onRename={
                  onRename
                }
                onTrash={
                  onTrash
                }
                onStar={
                  onStar
                }
                onDownload={
                  onDownload
                }
                onDetails={
                  onDetails
                }
                onCopyLink={
                  onCopyLink
                }
                onMove={
                  onMove
                }
                selected={
                  isSelected(
                    "file",
                    file
                  )
                }
                onToggleSelect={() =>
                  onToggleSelect(
                    "file",
                    file
                  )
                }
                onItemDragStart={
                  onItemDragStart
                }
                onItemDragEnd={
                  onItemDragEnd
                }
              />
            )
          )}

        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

          {files.map(
            (file) => (
              <CloudFileCard
                key={
                  file.id
                }
                file={
                  file
                }
                type={
                  type
                }
                isDark={isDark}
                onOpen={
                  onOpen
                }
                onShare={
                  onShare
                }
                onRename={
                  onRename
                }
                onTrash={
                  onTrash
                }
                onStar={
                  onStar
                }
                onDownload={
                  onDownload
                }
                onDetails={
                  onDetails
                }
                onCopyLink={
                  onCopyLink
                }
                onMove={
                  onMove
                }
                selected={
                  isSelected(
                    "file",
                    file
                  )
                }
                onToggleSelect={() =>
                  onToggleSelect(
                    "file",
                    file
                  )
                }
                onItemDragStart={
                  onItemDragStart
                }
                onItemDragEnd={
                  onItemDragEnd
                }
              />
            )
          )}

        </div>
      )}

    </section>
  );
}

// ======================================================
// CLOUD FILE LIST ROW
// ======================================================

function CloudFileListRow({
  file,
  type,
  isDark,
  onOpen,
  onShare,
  onRename,
  onTrash,
  onStar,
  onDownload,
  onDetails,
  onCopyLink,
  onMove,
  selected,
  onToggleSelect,
  onItemDragStart,
  onItemDragEnd,
}) {
  const config =
    getCloudTypeConfig(
      type
    );

  const Icon =
    config.icon;

  return (
    <div
      data-selectable-item="true"
      data-selection-key={`file:${file.id}`}
      draggable
      onDragStart={(event) =>
        onItemDragStart(
          "file",
          file,
          event
        )
      }
      onDragEnd={onItemDragEnd}
      onDoubleClick={() =>
        onOpen(
          file
        )
      }
      className={`group grid grid-cols-[minmax(0,1fr)_150px_150px_100px_44px] items-center border-b px-4 py-3 transition last:border-b-0 ${
        isDark ? "border-slate-800" : "border-slate-100"
      } ${
        selected
          ? isDark
            ? "bg-violet-500/15 ring-1 ring-inset ring-violet-400/40"
            : "bg-violet-50 ring-1 ring-inset ring-violet-200"
          : isDark
            ? "bg-slate-900 hover:bg-slate-800/80"
            : "hover:bg-indigo-50/50"
      }`}
    >

      <div className="flex min-w-0 items-center gap-3">

        <SelectionCheckbox
          selected={
            selected
          }
          onClick={
            onToggleSelect
          }
        />

        <button
          type="button"
          onClick={() =>
            onOpen(
              file
            )
          }
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >

          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.modalIconClass}`}
          >
            <Icon
              size={19}
            />
          </div>

          <span className={`truncate font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            {getItemDisplayName(
              file
            )}
          </span>

          {file.isStarred && (
            <Star
              size={15}
              className="shrink-0 fill-amber-400 text-amber-400"
            />
          )}

        </button>

      </div>

      <span className={`truncate text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {
          config.badge
        }
      </span>

      <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {formatModifiedDate(
          file.updatedAt ||
          file.updated_at ||
          file.createdAt ||
          file.created_at
        )}
      </span>

      <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {formatFileSize(
          file.sizeBytes
        )}
      </span>

      <ItemActionMenu
        resourceType="file"
        item={
          file
        }
        onOpen={
          onOpen
        }
        onDownload={
          onDownload
        }
        onShare={
          onShare
        }
        onRename={
          onRename
        }
        onStar={
          onStar
        }
        onTrash={
          onTrash
        }
        onDetails={
          onDetails
        }
        onCopyLink={
          onCopyLink
        }
        onMove={
          onMove
        }
      />

    </div>
  );
}

// ======================================================
// CLOUD FILE CARD
// ======================================================

function CloudFileCard({
  file,
  type,
  isDark,
  onOpen,
  onShare,
  onRename,
  onTrash,
  onStar,
  onDownload,
  onDetails,
  onCopyLink,
  onMove,
  selected,
  onToggleSelect,
  onItemDragStart,
  onItemDragEnd,
}) {
  const config =
    getCloudTypeConfig(
      type
    );

  const Icon =
    config.icon;

  return (
    <div
      data-selectable-item="true"
      data-selection-key={`file:${file.id}`}
      draggable
      onDragStart={(event) =>
        onItemDragStart(
          "file",
          file,
          event
        )
      }
      onDragEnd={onItemDragEnd}
      className={`group relative overflow-visible rounded-2xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        selected
          ? isDark
            ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25"
            : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
          : isDark
            ? "border-slate-800 bg-slate-900 hover:border-violet-500/40 hover:bg-slate-800/80"
            : `bg-white ${config.borderClass}`
      }`}
    >

      <div className="absolute left-3 top-3 z-30">
        <SelectionCheckbox
          selected={
            selected
          }
          onClick={
            onToggleSelect
          }
        />
      </div>

      <div className="absolute right-3 top-3 z-30">
        <ItemActionMenu
          resourceType="file"
          item={
            file
          }
          onOpen={
            onOpen
          }
          onDownload={
            onDownload
          }
          onShare={
            onShare
          }
          onRename={
            onRename
          }
          onStar={
            onStar
          }
          onTrash={
            onTrash
          }
          onDetails={
            onDetails
          }
          onCopyLink={
            onCopyLink
          }
          onMove={
            onMove
          }
        />
      </div>

      <button
        type="button"
        onClick={() =>
          onOpen(
            file
          )
        }
        className="w-full cursor-pointer p-4 text-left"
      >

        <div
          className={`mb-4 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br ${config.previewClass}`}
        >

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${config.iconClass}`}
          >
            <Icon
              size={30}
            />
          </div>

        </div>

        <div className="flex items-start gap-2 pr-8">

          <div className="min-w-0 flex-1">

            <p className={`truncate font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              {getItemDisplayName(
                file
              )}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">

              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${config.badgeClass}`}
              >
                {
                  config.badge
                }
              </span>

              <span className="text-xs text-slate-400">
                {formatFileSize(
                  file.sizeBytes
                )}
              </span>

            </div>

          </div>

          {file.isStarred && (
            <Star
              size={17}
              className="shrink-0 fill-amber-400 text-amber-400"
            />
          )}

        </div>

      </button>

    </div>
  );
}

// ======================================================
// REGULAR FILE SECTION
// ======================================================

function RegularFileSection({
  files,
  isSearchMode,
  isDark,
  onOpen,
  onShare,
  onRename,
  onTrash,
  onStar,
  onDownload,
  onDetails,
  onCopyLink,
  onMove,
  viewMode,
  isSelected,
  onToggleSelect,
  onItemDragStart,
  onItemDragEnd,
}) {
  return (
    <section>

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          {isSearchMode
            ? "Matching files"
            : "Files"}
        </h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
          {
            files.length
          }
        </span>

      </div>

      {viewMode === "list" ? (
        <div className={`overflow-visible rounded-2xl border shadow-sm ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>

          <DriveListHeader />

          {files.map(
            (file) => {
              const selected =
                isSelected(
                  "file",
                  file
                );

              return (
                <div
                  key={
                    file.id
                  }
                  data-selectable-item="true"
                  data-selection-key={`file:${file.id}`}
                  draggable
                  onDragStart={(event) =>
                    onItemDragStart(
                      "file",
                      file,
                      event
                    )
                  }
                  onDragEnd={onItemDragEnd}
                  onDoubleClick={() =>
                    onOpen(
                      file
                    )
                  }
                  className={`group grid grid-cols-[minmax(0,1fr)_150px_150px_100px_44px] items-center border-b px-4 py-3 transition last:border-b-0 ${
                    isDark ? "border-slate-800" : "border-slate-100"
                  } ${
                    selected
                      ? isDark
                        ? "bg-violet-500/15 ring-1 ring-inset ring-violet-400/40"
                        : "bg-violet-50 ring-1 ring-inset ring-violet-200"
                      : isDark
                        ? "bg-slate-900 hover:bg-slate-800/80"
                        : "hover:bg-indigo-50/50"
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <SelectionCheckbox
                      selected={
                        selected
                      }
                      onClick={() =>
                        onToggleSelect(
                          "file",
                          file
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        onOpen(
                          file
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >

                      {(() => {
                        const config =
                          getItemTypeConfig(
                            file,
                            "file"
                          );

                        const Icon =
                          config.icon;

                        return (
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.iconBoxClass}`}
                          >
                            <Icon
                              size={19}
                            />
                          </div>
                        );
                      })()}

                      <span className={`truncate font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {
                          file.name
                        }
                      </span>

                      {file.isStarred && (
                        <Star
                          size={15}
                          className="shrink-0 fill-amber-400 text-amber-400"
                        />
                      )}

                    </button>

                  </div>

                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {getItemTypeConfig(
                      file,
                      "file"
                    ).label}
                  </span>

                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {formatModifiedDate(
                      file.updatedAt ||
                      file.updated_at ||
                      file.createdAt ||
                      file.created_at
                    )}
                  </span>

                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {formatFileSize(
                      file.sizeBytes
                    )}
                  </span>

                  <ItemActionMenu
                    resourceType="file"
                    item={
                      file
                    }
                    onOpen={
                      onOpen
                    }
                    onDownload={
                      onDownload
                    }
                    onShare={
                      onShare
                    }
                    onRename={
                      onRename
                    }
                    onStar={
                      onStar
                    }
                    onTrash={
                      onTrash
                    }
                    onDetails={
                      onDetails
                    }
                    onCopyLink={
                      onCopyLink
                    }
                    onMove={
                      onMove
                    }
                  />

                </div>
              );
            }
          )}

        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

          {files.map(
            (file) => {
              const selected =
                isSelected(
                  "file",
                  file
                );

              return (
                <div
                  key={
                    file.id
                  }
                  data-selectable-item="true"
                  data-selection-key={`file:${file.id}`}
                  draggable
                  onDragStart={(event) =>
                    onItemDragStart(
                      "file",
                      file,
                      event
                    )
                  }
                  onDragEnd={onItemDragEnd}
                  className={`group relative overflow-visible rounded-2xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    selected
                      ? isDark
                        ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/25"
                        : "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                      : isDark
                        ? "border-slate-800 bg-slate-900 hover:border-violet-500/40 hover:bg-slate-800/80"
                        : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >

                  <div className="absolute left-3 top-3 z-30">
                    <SelectionCheckbox
                      selected={
                        selected
                      }
                      onClick={() =>
                        onToggleSelect(
                          "file",
                          file
                        )
                      }
                    />
                  </div>

                  <div className="absolute right-3 top-3 z-30">
                    <ItemActionMenu
                      resourceType="file"
                      item={
                        file
                      }
                      onOpen={
                        onOpen
                      }
                      onDownload={
                        onDownload
                      }
                      onShare={
                        onShare
                      }
                      onRename={
                        onRename
                      }
                      onStar={
                        onStar
                      }
                      onTrash={
                        onTrash
                      }
                      onDetails={
                        onDetails
                      }
                      onCopyLink={
                        onCopyLink
                      }
                      onMove={
                        onMove
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpen(
                        file
                      )
                    }
                    className="w-full cursor-pointer p-4 text-left"
                  >

                    {(() => {
                      const config =
                        getItemTypeConfig(
                          file,
                          "file"
                        );

                      const Icon =
                        config.icon;

                      if (config.key === "image") {
                        return (
                          <div className="mb-4 h-24 overflow-hidden rounded-xl">
                            <FilePreviewThumbnail
                              file={file}
                              isDark={isDark}
                            />
                          </div>
                        );
                      }

                      if (config.key === "pdf") {
                        return (
                          <div className="mb-4 h-24 overflow-hidden rounded-xl">
                            <PdfPreviewThumbnail
                              file={file}
                              isDark={isDark}
                            />
                          </div>
                        );
                      }

                      if (
                        config.key === "video" ||
                        config.key === "audio"
                      ) {
                        return (
                          <div className="mb-4 h-24 overflow-hidden rounded-xl">
                            <MediaPreviewThumbnail
                              file={file}
                              isDark={isDark}
                            />
                          </div>
                        );
                      }

                      if (
                        [
                          "word",
                          "excel",
                          "powerpoint",
                          "document",
                          "spreadsheet",
                          "presentation",
                          "text",
                          "code",
                          "archive",
                        ].includes(config.key)
                      ) {
                        return (
                          <div className="mb-4 h-24 overflow-hidden rounded-xl">
                            <OfficeFilePreviewCard
                              file={file}
                              typeKey={config.key}
                              isDark={isDark}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          className={`mb-4 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br ${config.previewClass}`}
                        >
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${config.iconClass}`}
                          >
                            <Icon
                              size={30}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2 pr-8">

                      <p className={`min-w-0 flex-1 truncate font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {
                          file.name
                        }
                      </p>

                      {file.isStarred && (
                        <Star
                          size={17}
                          className="shrink-0 fill-amber-400 text-amber-400"
                        />
                      )}

                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">

                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          getItemTypeConfig(
                            file,
                            "file"
                          ).badgeClass
                        }`}
                      >
                        {getItemTypeConfig(
                          file,
                          "file"
                        ).label}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatFileSize(
                          file.sizeBytes
                        )}
                      </span>

                    </div>

                  </button>

                </div>
              );
            }
          )}

        </div>
      )}

    </section>
  );
}

// ======================================================
// SELECTION CHECKBOX
// ======================================================

function SelectionCheckbox({
  selected,
  onClick,
}) {
  const { settings } = useOutletContext();

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
    (settings?.theme === "system" && systemDark);

  return (
    <button
      type="button"
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
      title={selected ? "Deselect" : "Select"}
    >
      <Check size={15} strokeWidth={3} />
    </button>
  );
}

// ======================================================
// BULK DELETE CONFIRMATION MODAL
// ======================================================

function BulkDeleteConfirmModal({
  items,
  deleting,
  onCancel,
  onConfirm,
}) {
  const names =
    items
      .slice(
        0,
        4
      )
      .map(
        (selected) =>
          getItemDisplayName(
            selected.item
          )
      );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="p-6">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2
              size={23}
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Move selected items to Trash?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            You are about to move{" "}
            <span className="font-semibold text-slate-700">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>{" "}
            to Trash. You can restore them later from the Trash page.
          </p>

          <div className="mt-5 max-h-36 overflow-y-auto rounded-2xl bg-slate-50 px-4 py-3">

            {names.map(
              (name, index) => (
                <div
                  key={`${name}-${index}`}
                  className="truncate py-1 text-sm font-medium text-slate-600"
                >
                  • {name}
                </div>
              )
            )}

            {items.length > 4 && (
              <div className="pt-1 text-sm font-semibold text-slate-400">
                + {items.length - 4} more
              </div>
            )}

          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onCancel
            }
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onConfirm
            }
            className="flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? (
              <>
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />

                Moving...
              </>
            ) : (
              <>
                <Trash2
                  size={16}
                />

                Move to Trash
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// ITEM DETAILS MODAL
// ======================================================

function ItemDetailsModal({
  target,
  onClose,
}) {
  const {
    resourceType,
    item,
  } = target;

  const isFolder =
    resourceType ===
    "folder";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

          <div className="flex items-center gap-3">

            {(() => {
              const config =
                getItemTypeConfig(
                  item,
                  resourceType
                );

              const Icon =
                config.icon;

              return (
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${config.iconBoxClass}`}
                >
                  <Icon
                    size={22}
                  />
                </div>
              );
            })()}

            <div className="min-w-0">

              <h2 className="truncate text-lg font-bold text-slate-900">
                {getItemDisplayName(
                  item
                )}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {isFolder
                  ? "Folder information"
                  : "File information"}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X
              size={19}
            />
          </button>

        </div>

        <div className="space-y-4 p-6">

          <DetailRow
            label="Type"
            value={
              getItemTypeConfig(
                item,
                resourceType
              ).label
            }
          />

          <DetailRow
  label="Size"
  value={
    formatFileSize(
      item.sizeBytes
    )
  }
/>

          <DetailRow
            label="Starred"
            value={
              item.isStarred
                ? "Yes"
                : "No"
            }
          />

          <DetailRow
            label="Modified"
            value={
              formatModifiedDate(
                item.updatedAt ||
                item.updated_at ||
                item.createdAt ||
                item.created_at
              )
            }
          />

          <DetailRow
            label="ID"
            value={
              item.id ||
              "—"
            }
          />

        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Done
          </button>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// DETAIL ROW
// ======================================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex items-start justify-between gap-6">

      <span className="text-sm font-medium text-slate-400">
        {
          label
        }
      </span>

      <span className="min-w-0 break-all text-right text-sm font-semibold text-slate-700">
        {
          value
        }
      </span>

    </div>
  );
}

// ======================================================
// CREATE ITEM MODAL
// ======================================================

function CreateItemModal({
  type,
  title,
  description,
  value,
  onChange,
  placeholder,
  currentFolder,
  loading,
  selectedTemplate,
  onClose,
  onSubmit,
}) {
  const config =
    getCloudTypeConfig(
      type
    );

  const Icon =
    config.icon;

  const label =
    type ===
    "document"
      ? "Document name"
      : type ===
          "spreadsheet"
        ? "Spreadsheet name"
        : "Presentation name";

  const defaultName =
    type ===
    "document"
      ? "Untitled document"
      : type ===
          "spreadsheet"
        ? "Untitled spreadsheet"
        : "Untitled presentation";

  const buttonText =
    selectedTemplate
      ? "Use Template"
      : type ===
          "document"
        ? "Create Document"
        : type ===
            "spreadsheet"
          ? "Create Spreadsheet"
          : "Create Presentation";

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">

      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="border-b border-slate-100 px-6 py-5">

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-start gap-4">

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.modalIconClass}`}
              >
                <Icon
                  size={24}
                />
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {
                    title
                  }
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {
                    description
                  }
                </p>

              </div>

            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                onClose
              }
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X
                size={20}
              />
            </button>

          </div>

        </div>

        <form
          onSubmit={
            onSubmit
          }
          className="p-6"
        >

          {/* TEMPLATE INDICATOR */}

          {selectedTemplate && (
            <div
              className={`mb-5 rounded-2xl border p-4 ${config.templateBoxClass}`}
            >

              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Selected template
              </p>

              <div className="mt-2 flex items-center gap-3">

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ${config.iconClass}`}
                >
                  <Icon
                    size={18}
                  />
                </div>

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    {
                      selectedTemplate.name
                    }
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {
                      selectedTemplate.description
                    }
                  </p>

                </div>

              </div>

            </div>
          )}

          <label className="text-sm font-semibold text-slate-700">
            {
              label
            }
          </label>

          <input
            autoFocus
            value={
              value
            }
            onChange={(e) =>
              onChange(
                e.target.value
              )
            }
            placeholder={
              placeholder
            }
            className={`mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${config.inputFocusClass}`}
          />

          <div
            className={`mt-5 rounded-2xl border p-4 ${config.templateBoxClass}`}
          >

            <div className="flex items-center gap-3">

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${config.iconClass}`}
              >
                <Icon
                  size={20}
                />
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-700">
                  {value.trim() ||
                    defaultName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {currentFolder
                    ? `Will be created in ${currentFolder.name}`
                    : "Will be created in My Drive"}
                </p>

              </div>

            </div>

          </div>

          <div className="mt-7 flex justify-end gap-3">

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                onClose
              }
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !value.trim()
              }
              className={`flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonGradientClass}`}
            >

              {loading ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  Creating...
                </>
              ) : (
                <>
                  <Icon
                    size={17}
                  />

                  {
                    buttonText
                  }
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

// ======================================================
// PROJECT FOLDER PREVIEW
// ======================================================

function ProjectFolderRow({
  name,
}) {
  return (
    <div className="ml-5 flex items-center gap-2 text-slate-600">

      <span className="text-slate-300">
        └
      </span>

      <Folder
        size={15}
        className="text-indigo-400"
      />

      <span>
        {
          name
        }
      </span>

    </div>
  );
}

// ======================================================
// ITEM TYPE / COLOR CONFIG
// ======================================================

function getFileExtension(
  name = ""
) {
  const cleanName =
    String(name)
      .toLowerCase()
      .trim();

  const lastDot =
    cleanName.lastIndexOf(
      "."
    );

  if (
    lastDot <= 0 ||
    lastDot ===
      cleanName.length - 1
  ) {
    return "";
  }

  return cleanName.slice(
    lastDot + 1
  );
}

function getItemTypeConfig(
  item,
  resourceType = "file"
) {
  const isFolder =
    resourceType ===
      "folder";

  const isProject =
    Boolean(
      item?.isProject ??
      item?.is_project
    );

  if (isFolder) {
    if (isProject) {
      return {
        key: "project",
        label: "Project",
        icon: FolderKanban,
        iconBoxClass:
          "bg-violet-50 text-violet-600",
        iconClass:
          "text-violet-600",
        badgeClass:
          "bg-violet-50 text-violet-700",
        previewClass:
          "from-violet-50 via-purple-50 to-indigo-50",
      };
    }

    return {
      key: "folder",
      label: "Folder",
      icon: Folder,
      iconBoxClass:
        "bg-amber-50 text-amber-600",
      iconClass:
        "text-amber-500",
      badgeClass:
        "bg-amber-50 text-amber-700",
      previewClass:
        "from-amber-50 via-yellow-50 to-orange-50",
    };
  }

  if (
    item?.fileKind ===
    "document"
  ) {
    return {
      key: "document",
      label:
        "Cloud Document",
      icon: FileText,
      iconBoxClass:
        "bg-indigo-50 text-indigo-600",
      iconClass:
        "text-indigo-600",
      badgeClass:
        "bg-indigo-50 text-indigo-700",
      previewClass:
        "from-indigo-50 via-violet-50 to-purple-50",
    };
  }

  if (
    item?.fileKind ===
    "spreadsheet"
  ) {
    return {
      key: "spreadsheet",
      label:
        "Cloud Spreadsheet",
      icon: Sheet,
      iconBoxClass:
        "bg-emerald-50 text-emerald-600",
      iconClass:
        "text-emerald-600",
      badgeClass:
        "bg-emerald-50 text-emerald-700",
      previewClass:
        "from-emerald-50 via-green-50 to-teal-50",
    };
  }

  if (
    item?.fileKind ===
    "presentation"
  ) {
    return {
      key: "presentation",
      label:
        "Cloud Presentation",
      icon: Presentation,
      iconBoxClass:
        "bg-orange-50 text-orange-600",
      iconClass:
        "text-orange-600",
      badgeClass:
        "bg-orange-50 text-orange-700",
      previewClass:
        "from-orange-50 via-amber-50 to-yellow-50",
    };
  }

  const extension =
    getFileExtension(
      item?.name
    );

  const mimeType =
    String(
      item?.mimeType ||
      item?.mime_type ||
      ""
    ).toLowerCase();

  const isPdf =
    extension === "pdf" ||
    mimeType ===
      "application/pdf";

  if (isPdf) {
    return {
      key: "pdf",
      label: "PDF",
      icon: FileText,
      iconBoxClass:
        "bg-red-50 text-red-600",
      iconClass:
        "text-red-600",
      badgeClass:
        "bg-red-50 text-red-700",
      previewClass:
        "from-red-50 via-rose-50 to-orange-50",
    };
  }

  const isWord =
    [
      "doc",
      "docx",
      "odt",
      "rtf",
    ].includes(
      extension
    ) ||
    mimeType.includes(
      "word"
    ) ||
    mimeType.includes(
      "wordprocessingml"
    );

  if (isWord) {
    return {
      key: "word",
      label: "Word",
      icon: FileText,
      iconBoxClass:
        "bg-blue-50 text-blue-600",
      iconClass:
        "text-blue-600",
      badgeClass:
        "bg-blue-50 text-blue-700",
      previewClass:
        "from-blue-50 via-sky-50 to-indigo-50",
    };
  }

  const isExcel =
    [
      "xls",
      "xlsx",
      "xlsm",
      "ods",
      "csv",
    ].includes(
      extension
    ) ||
    mimeType.includes(
      "excel"
    ) ||
    mimeType.includes(
      "spreadsheetml"
    ) ||
    mimeType ===
      "text/csv";

  if (isExcel) {
    return {
      key: "excel",
      label: "Excel",
      icon: Sheet,
      iconBoxClass:
        "bg-emerald-50 text-emerald-700",
      iconClass:
        "text-emerald-700",
      badgeClass:
        "bg-emerald-50 text-emerald-800",
      previewClass:
        "from-emerald-50 via-green-50 to-lime-50",
    };
  }

  const isPowerPoint =
    [
      "ppt",
      "pptx",
      "pptm",
      "odp",
    ].includes(
      extension
    ) ||
    mimeType.includes(
      "powerpoint"
    ) ||
    mimeType.includes(
      "presentationml"
    );

  if (isPowerPoint) {
    return {
      key:
        "powerpoint",
      label:
        "PowerPoint",
      icon:
        Presentation,
      iconBoxClass:
        "bg-orange-50 text-orange-700",
      iconClass:
        "text-orange-700",
      badgeClass:
        "bg-orange-50 text-orange-800",
      previewClass:
        "from-orange-50 via-amber-50 to-red-50",
    };
  }

  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    "tif",
    "tiff",
    "heic",
  ];

  if (
    imageExtensions.includes(
      extension
    ) ||
    mimeType.startsWith(
      "image/"
    )
  ) {
    return {
      key: "image",
      label: "Image",
      icon: FileImage,
      iconBoxClass:
        "bg-pink-50 text-pink-600",
      iconClass:
        "text-pink-600",
      badgeClass:
        "bg-pink-50 text-pink-700",
      previewClass:
        "from-pink-50 via-fuchsia-50 to-purple-50",
    };
  }

  const videoExtensions = [
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm",
    "m4v",
    "mpeg",
    "mpg",
  ];

  if (
    videoExtensions.includes(
      extension
    ) ||
    mimeType.startsWith(
      "video/"
    )
  ) {
    return {
      key: "video",
      label: "Video",
      icon: FileVideo,
      iconBoxClass:
        "bg-purple-50 text-purple-600",
      iconClass:
        "text-purple-600",
      badgeClass:
        "bg-purple-50 text-purple-700",
      previewClass:
        "from-purple-50 via-violet-50 to-indigo-50",
    };
  }

  const audioExtensions = [
    "mp3",
    "wav",
    "m4a",
    "aac",
    "flac",
    "ogg",
  ];

  if (
    audioExtensions.includes(
      extension
    ) ||
    mimeType.startsWith(
      "audio/"
    )
  ) {
    return {
      key: "audio",
      label: "Audio",
      icon: FileAudio,
      iconBoxClass:
        "bg-cyan-50 text-cyan-600",
      iconClass:
        "text-cyan-600",
      badgeClass:
        "bg-cyan-50 text-cyan-700",
      previewClass:
        "from-cyan-50 via-sky-50 to-blue-50",
    };
  }

  const archiveExtensions = [
    "zip",
    "rar",
    "7z",
    "tar",
    "gz",
    "bz2",
  ];

  if (
    archiveExtensions.includes(
      extension
    ) ||
    mimeType.includes(
      "zip"
    ) ||
    mimeType.includes(
      "compressed"
    ) ||
    mimeType.includes(
      "archive"
    )
  ) {
    return {
      key: "archive",
      label: "Archive",
      icon: FileArchive,
      iconBoxClass:
        "bg-yellow-50 text-yellow-700",
      iconClass:
        "text-yellow-700",
      badgeClass:
        "bg-yellow-50 text-yellow-800",
      previewClass:
        "from-yellow-50 via-amber-50 to-orange-50",
    };
  }

  const codeExtensions = [
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "h",
    "hpp",
    "cs",
    "go",
    "rs",
    "php",
    "rb",
    "swift",
    "kt",
    "kts",
    "html",
    "htm",
    "css",
    "scss",
    "sass",
    "less",
    "json",
    "xml",
    "yaml",
    "yml",
    "sql",
    "sh",
    "bash",
  ];

  if (
    codeExtensions.includes(
      extension
    )
  ) {
    return {
      key: "code",
      label: "Code",
      icon: FileCode2,
      iconBoxClass:
        "bg-slate-100 text-slate-700",
      iconClass:
        "text-slate-700",
      badgeClass:
        "bg-slate-100 text-slate-700",
      previewClass:
        "from-slate-100 via-slate-50 to-zinc-50",
    };
  }

  const textExtensions = [
    "txt",
    "md",
    "log",
  ];

  if (
    textExtensions.includes(
      extension
    ) ||
    mimeType.startsWith(
      "text/"
    )
  ) {
    return {
      key: "text",
      label: "Text",
      icon: FileText,
      iconBoxClass:
        "bg-sky-50 text-sky-600",
      iconClass:
        "text-sky-600",
      badgeClass:
        "bg-sky-50 text-sky-700",
      previewClass:
        "from-sky-50 via-blue-50 to-cyan-50",
    };
  }

  return {
    key: "other",
    label:
      extension
        ? `${extension.toUpperCase()} file`
        : "Other file",
    icon: FileText,
    iconBoxClass:
      "bg-slate-100 text-slate-500",
    iconClass:
      "text-slate-500",
    badgeClass:
      "bg-slate-100 text-slate-600",
    previewClass:
      "from-slate-100 via-slate-50 to-white",
  };
}

// ======================================================
// CLOUD TYPE CONFIG
// ======================================================

function getCloudTypeConfig(
  type
) {
  if (
    type ===
    "spreadsheet"
  ) {
    return {
      icon:
        Sheet,

      badge:
        "Cloud Spreadsheet",

      countClass:
        "bg-emerald-50 text-emerald-600",

      borderClass:
        "border-emerald-100 hover:border-emerald-300",

      previewClass:
        "from-emerald-50 via-green-50 to-teal-50",

      iconClass:
        "text-emerald-600",

      badgeClass:
        "bg-emerald-50 text-emerald-600",

      openClass:
        "text-emerald-600 hover:bg-emerald-50",

      modalIconClass:
        "bg-emerald-50 text-emerald-600",

      templateBoxClass:
        "border-emerald-100 bg-emerald-50/60",

      inputFocusClass:
        "focus:border-emerald-300 focus:ring-emerald-100",

      buttonGradientClass:
        "from-emerald-500 to-green-600",
    };
  }

  if (
    type ===
    "presentation"
  ) {
    return {
      icon:
        Presentation,

      badge:
        "Cloud Presentation",

      countClass:
        "bg-amber-50 text-amber-600",

      borderClass:
        "border-amber-100 hover:border-amber-300",

      previewClass:
        "from-amber-50 via-orange-50 to-yellow-50",

      iconClass:
        "text-amber-600",

      badgeClass:
        "bg-amber-50 text-amber-700",

      openClass:
        "text-amber-600 hover:bg-amber-50",

      modalIconClass:
        "bg-amber-50 text-amber-600",

      templateBoxClass:
        "border-amber-100 bg-amber-50/60",

      inputFocusClass:
        "focus:border-amber-300 focus:ring-amber-100",

      buttonGradientClass:
        "from-amber-500 to-orange-500",
    };
  }

  return {
    icon:
      FileText,

    badge:
      "Cloud Document",

    countClass:
      "bg-indigo-50 text-indigo-600",

    borderClass:
      "border-indigo-100 hover:border-indigo-300",

    previewClass:
      "from-indigo-50 via-violet-50 to-purple-50",

    iconClass:
      "text-indigo-600",

    badgeClass:
      "bg-indigo-50 text-indigo-600",

    openClass:
      "text-indigo-600 hover:bg-indigo-50",

    modalIconClass:
      "bg-indigo-50 text-indigo-600",

    templateBoxClass:
      "border-indigo-100 bg-indigo-50/60",

    inputFocusClass:
      "focus:border-indigo-300 focus:ring-indigo-100",

    buttonGradientClass:
      "from-indigo-500 to-violet-600",
  };
}

// ======================================================
// ITEM DISPLAY NAME
// ======================================================

function getItemDisplayName(
  item
) {
  if (!item) {
    return "";
  }

  if (
    item.fileKind ===
    "document"
  ) {
    return getDocumentDisplayName(
      item.name
    );
  }

  if (
    item.fileKind ===
    "spreadsheet"
  ) {
    return getSpreadsheetDisplayName(
      item.name
    );
  }

  if (
    item.fileKind ===
    "presentation"
  ) {
    return getPresentationDisplayName(
      item.name
    );
  }

  return item.name;
}

// ======================================================
// DOCUMENT DISPLAY NAME
// ======================================================

function getDocumentDisplayName(
  name
) {
  if (!name) {
    return "Untitled document";
  }

  return name.replace(
    /\.txt$/i,
    ""
  );
}

// ======================================================
// SPREADSHEET DISPLAY NAME
// ======================================================

function getSpreadsheetDisplayName(
  name
) {
  if (!name) {
    return "Untitled spreadsheet";
  }

  return name.replace(
    /\.cloudsheet$/i,
    ""
  );
}

// ======================================================
// PRESENTATION DISPLAY NAME
// ======================================================

function getPresentationDisplayName(
  name
) {
  if (!name) {
    return "Untitled presentation";
  }

  return name.replace(
    /\.cloudslides$/i,
    ""
  );
}

// ======================================================
// FILE SIZE
// ======================================================

function formatFileSize(
  bytes
) {
  const value =
    Number(
      bytes || 0
    );

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
        Math.log(
          value
        ) /
          Math.log(
            1024
          )
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


// ======================================================
// MODIFIED DATE
// ======================================================

function formatModifiedDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() ===
        new Date().getFullYear()
          ? undefined
          : "numeric",
    }
  );
}

export default DashboardPage;