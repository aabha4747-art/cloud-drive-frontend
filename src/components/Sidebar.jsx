import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  FolderOpen,
  FolderPlus,
  FolderUp,
  HardDrive,
  Plus,
  Presentation,
  Settings,
  Share2,
  Sheet,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import api from "../api/axios";

import { hasDriveDragPayload, hasExternalFiles, readDriveDragPayload } from "../utils/driveDragData";

const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;

  if (value <= 0) return "0 B";

  const KB = 1024;
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;
  const TB = 1024 * 1024 * 1024 * 1024;

  if (value < KB) return `${Math.round(value)} B`;
  if (value < MB) return `${(value / KB).toFixed(2)} KB`;
  if (value < GB) return `${(value / MB).toFixed(3)} MB`;
  if (value < TB) return `${(value / GB).toFixed(2)} GB`;

  return `${(value / TB).toFixed(2)} TB`;
};

function Sidebar({
  isDark = false,
  accent = {
    primary: "#7c3aed",
    secondary: "#6366f1",
    soft: "#f5f3ff",
  },
  onOpenSettings,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const newMenuRef = useRef(null);
  const projectHoverTimerRef = useRef(null);

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const [storage, setStorage] = useState(null);
  const [storageLoading, setStorageLoading] = useState(true);

  const [trashDropActive, setTrashDropActive] = useState(false);
  const [trashingSidebarItems, setTrashingSidebarItems] = useState(false);
  const [starredDropActive, setStarredDropActive] = useState(false);
  const [starringSidebarItems, setStarringSidebarItems] = useState(false);
  const [projectsDropActive, setProjectsDropActive] = useState(false);

  const menuItems = [
    {
      label: "My Drive",
      path: "/dashboard",
      icon: FolderOpen,
    },
    {
      label: "Projects",
      path: "/projects",
      icon: FolderKanban,
    },
    {
      label: "Shared with me",
      path: "/shared",
      icon: Share2,
    },
    {
      label: "Recent",
      path: "/recent",
      icon: Clock3,
    },
    {
      label: "Starred",
      path: "/starred",
      icon: Star,
    },
    {
      label: "Trash",
      path: "/trash",
      icon: Trash2,
    },
    {
      label: "Storage",
      path: "/storage",
      icon: HardDrive,
    },
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    if (path === "/projects") {
      return (
        location.pathname === "/projects" ||
        location.pathname.startsWith("/projects/")
      );
    }

    if (path === "/shared") {
      return (
        location.pathname === "/shared" ||
        location.pathname.startsWith("/shared/")
      );
    }

    return location.pathname === path;
  };

  const fetchStorage = useCallback(async () => {
    try {
      const response = await api.get("/storage/summary");

      setStorage(
        response.data?.storage ||
          null
      );
    } catch (error) {
      console.error(
        "Unable to load sidebar storage:",
        error
      );

      setStorage(null);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  useEffect(() => {
    const handleStorageChanged = () => {
      fetchStorage();
    };

    window.addEventListener(
      "cloud-drive-storage-changed",
      handleStorageChanged
    );

    return () => {
      window.removeEventListener(
        "cloud-drive-storage-changed",
        handleStorageChanged
      );
    };
  }, [fetchStorage]);

  useEffect(() => {
    fetchStorage();
  }, [
    location.pathname,
    fetchStorage,
  ]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        newMenuRef.current &&
        !newMenuRef.current.contains(event.target)
      ) {
        setShowNewMenu(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    setShowNewMenu(false);
    setActiveSubmenu(null);
    setTrashDropActive(false);
    setStarredDropActive(false);
    setProjectsDropActive(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (projectHoverTimerRef.current) {
        clearTimeout(projectHoverTimerRef.current);
      }
    };
  }, []);

  const runDashboardAction = (action) => {
    setShowNewMenu(false);
    setActiveSubmenu(null);

    navigate("/dashboard", {
      state: {
        action,
      },
    });
  };

  const handleNavigate = (path) => {
    setShowNewMenu(false);
    setActiveSubmenu(null);
    navigate(path);
  };

  // ======================================================
  // STARRED SIDEBAR DROP TARGET
  // ======================================================

  const readSidebarDragPayload = (dataTransfer) => {
    const payload = readDriveDragPayload(dataTransfer);

    if (payload) {
      return payload;
    }

    try {
      const raw = dataTransfer?.getData("text/plain");

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      if (
        parsed?.source !== "cloud-drive" ||
        !Array.isArray(parsed?.items)
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const handleStarredDragEnter = (event) => {
    if (hasExternalFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setStarredDropActive(true);
  };

  const handleStarredDragOver = (event) => {
    if (hasExternalFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "move";
    setStarredDropActive(true);
  };

  const handleStarredDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const related = event.relatedTarget;

    if (
      related &&
      event.currentTarget.contains(related)
    ) {
      return;
    }

    setStarredDropActive(false);
  };

  const handleStarredDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setStarredDropActive(false);

    if (hasExternalFiles(event.dataTransfer)) {
      return;
    }

    const payload =
      readSidebarDragPayload(
        event.dataTransfer
      );

    const items =
      payload?.items || [];

    if (
      items.length === 0 ||
      starringSidebarItems
    ) {
      console.warn(
        "No Cloud Drive drag payload reached Starred."
      );
      return;
    }

    try {
      setStarringSidebarItems(true);

      const results =
        await Promise.allSettled(
          items.map((entry) => {
            if (entry.resourceType === "folder") {
              return api.patch(
                `/starred/folders/${entry.id}`
              );
            }

            return api.patch(
              `/starred/files/${entry.id}`
            );
          })
        );

      const failed =
        results.filter(
          (result) =>
            result.status === "rejected"
        );

      const successCount =
        results.length - failed.length;

      if (failed.length > 0) {
        const firstError =
          failed[0]?.reason;

        window.alert(
          firstError?.response?.data?.error?.message ||
          firstError?.response?.data?.message ||
          `${failed.length} item${
            failed.length === 1 ? "" : "s"
          } could not be added to Starred.`
        );
      }

      if (successCount > 0) {
        window.dispatchEvent(
          new CustomEvent(
            "cloud-drive-items-changed",
            {
              detail: {
                action: "starred",
                count: successCount,
              },
            }
          )
        );

        navigate("/starred");
      }
    } catch (error) {
      console.error(
        "Sidebar Starred drop error:",
        error
      );

      window.alert(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Unable to add item to Starred."
      );
    } finally {
      setStarringSidebarItems(false);
      setStarredDropActive(false);
    }
  };

  // ======================================================
  // PROJECTS SIDEBAR HOVER TARGET
  // ======================================================

  const handleProjectsDragEnter = (event) => {
    if (
      !hasDriveDragPayload(
        event.dataTransfer
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setProjectsDropActive(true);

    if (
      projectHoverTimerRef.current
    ) {
      clearTimeout(
        projectHoverTimerRef.current
      );
    }

    projectHoverTimerRef.current =
      setTimeout(() => {
        setProjectsDropActive(false);
        navigate("/projects");
      }, 700);
  };

  const handleProjectsDragOver = (event) => {
    if (
      !hasDriveDragPayload(
        event.dataTransfer
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect =
      "move";

    setProjectsDropActive(true);
  };

  const handleProjectsDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const related =
      event.relatedTarget;

    if (
      related &&
      event.currentTarget.contains(
        related
      )
    ) {
      return;
    }

    if (
      projectHoverTimerRef.current
    ) {
      clearTimeout(
        projectHoverTimerRef.current
      );

      projectHoverTimerRef.current =
        null;
    }

    setProjectsDropActive(false);
  };

  const handleProjectsDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      projectHoverTimerRef.current
    ) {
      clearTimeout(
        projectHoverTimerRef.current
      );

      projectHoverTimerRef.current =
        null;
    }

    setProjectsDropActive(false);
    navigate("/projects");
  };

  // ======================================================
  // TRASH SIDEBAR DROP TARGET
  // ======================================================

  const handleTrashDragEnter = (event) => {
    const internal =
      hasDriveDragPayload(event.dataTransfer);

    const external =
      hasExternalFiles(event.dataTransfer);

    if (!internal && !external) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setTrashDropActive(true);
  };

  const handleTrashDragOver = (event) => {
    const internal =
      hasDriveDragPayload(event.dataTransfer);

    const external =
      hasExternalFiles(event.dataTransfer);

    if (!internal && !external) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect =
      internal
        ? "move"
        : "none";

    setTrashDropActive(true);
  };

  const handleTrashDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const current = event.currentTarget;
    const related = event.relatedTarget;

    if (
      related &&
      current.contains(related)
    ) {
      return;
    }

    setTrashDropActive(false);
  };

  const handleTrashDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setTrashDropActive(false);

    if (
      hasExternalFiles(
        event.dataTransfer
      )
    ) {
      window.alert(
        "Files from your computer cannot be dropped directly into Trash. Upload them to My Drive first."
      );

      return;
    }

    const payload =
      readDriveDragPayload(
        event.dataTransfer
      );

    const items =
      payload?.items || [];

    if (
      items.length === 0 ||
      trashingSidebarItems
    ) {
      return;
    }

    try {
      setTrashingSidebarItems(true);

      const results =
        await Promise.allSettled(
          items.map((entry) => {
            if (
              entry.resourceType ===
              "folder"
            ) {
              return api.delete(
                `/folders/${entry.id}`
              );
            }

            return api.delete(
              `/files/${entry.id}`
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
        window.dispatchEvent(
          new Event(
            "cloud-drive-storage-changed"
          )
        );

        window.dispatchEvent(
          new CustomEvent(
            "cloud-drive-items-changed",
            {
              detail: {
                action:
                  "moved-to-trash",
                count:
                  movedCount,
              },
            }
          )
        );
      }

      if (failed.length > 0) {
        const firstError =
          failed[0]?.reason;

        window.alert(
          firstError?.response?.data
            ?.error?.message ||
          firstError?.response?.data
            ?.message ||
          `${failed.length} item${
            failed.length === 1
              ? ""
              : "s"
          } could not be moved to Trash.`
        );
      }

      if (movedCount > 0) {
        navigate("/trash");
      }
    } catch (error) {
      console.error(
        "Sidebar Trash drop error:",
        error
      );

      window.alert(
        error.response?.data
          ?.error?.message ||
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to move item to Trash."
      );
    } finally {
      setTrashingSidebarItems(false);
      setTrashDropActive(false);
    }
  };

  const storagePercentage =
    Math.min(
      Math.max(
        Number(
          storage?.percentageUsed
        ) || 0,
        0
      ),
      100
    );

  const storageUsed =
    formatBytes(
      storage?.usedBytes
    );

  const storageQuota =
    formatBytes(
      storage?.quotaBytes
    );

  const storageFull =
    Boolean(
      storage?.isFull
    );

  return (
    <aside
      className={`
        relative
        flex
        h-screen
        w-64
        shrink-0
        flex-col
        border-r
        transition-colors
        duration-300
        ${
          isDark
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white"
        }
      `}
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl
            text-base
            font-bold
            text-white
            shadow-md
          "
          style={{
            background:
              `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
          }}
        >
          C
        </div>

        <div className="min-w-0">
          <h1
            className={`truncate text-lg font-bold tracking-tight ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Cloud Drive
          </h1>

          <p
            className={`mt-0.5 text-xs font-medium ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Secure storage
          </p>
        </div>
      </div>

      <div className="h-5" />

      <div
        ref={newMenuRef}
        className="relative px-4"
      >
        <button
          type="button"
          onClick={() => {
            setShowNewMenu(
              (current) =>
                !current
            );

            setActiveSubmenu(null);
          }}
          className="
            group
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-2xl
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-md
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-lg
          "
          style={{
            background:
              `linear-gradient(90deg, ${accent.secondary}, ${accent.primary})`,
          }}
        >
          {showNewMenu ? (
            <X size={18} />
          ) : (
            <Plus
              size={18}
              className="transition-transform duration-200 group-hover:rotate-90"
            />
          )}

          New
        </button>

        {showNewMenu && (
          <div
            className={`
              absolute
              left-4
              right-4
              top-[56px]
              z-[100]
              overflow-visible
              rounded-2xl
              border
              py-2
              shadow-2xl
              ${
                isDark
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-white"
              }
            `}
          >
            <NewMenuButton
              icon={FolderPlus}
              label="New folder"
              isDark={isDark}
              onClick={() =>
                runDashboardAction(
                  "new-folder"
                )
              }
            />

            <MenuDivider
              isDark={isDark}
            />

            <NewMenuButton
              icon={Upload}
              label="File upload"
              isDark={isDark}
              onClick={() =>
                runDashboardAction(
                  "upload-file"
                )
              }
            />

            <NewMenuButton
              icon={FolderUp}
              label="Folder upload"
              isDark={isDark}
              onClick={() =>
                runDashboardAction(
                  "upload-folder"
                )
              }
            />

            <MenuDivider
              isDark={isDark}
            />

            <NewMenuButton
              icon={FolderKanban}
              label="New project"
              isDark={isDark}
              onClick={() =>
                runDashboardAction(
                  "new-project"
                )
              }
            />

            <MenuDivider
              isDark={isDark}
            />

            <NewMenuButton
              icon={FileText}
              label="New document"
              isDark={isDark}
              onClick={() =>
                runDashboardAction(
                  "new-document"
                )
              }
            />

            <div className="relative">
              <ExpandableMenuButton
                icon={Sheet}
                label="New spreadsheet"
                expanded={
                  activeSubmenu ===
                  "spreadsheet"
                }
                isDark={isDark}
                onClick={() =>
                  setActiveSubmenu(
                    (current) =>
                      current ===
                      "spreadsheet"
                        ? null
                        : "spreadsheet"
                  )
                }
              />

              {activeSubmenu ===
                "spreadsheet" && (
                <div
                  className={`
                    absolute
                    left-[calc(100%+12px)]
                    top-0
                    z-[160]
                    w-[250px]
                    overflow-hidden
                    rounded-2xl
                    border
                    shadow-2xl
                    ${
                      isDark
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }
                  `}
                >
                  <SubmenuButton
                    icon={Sheet}
                    label="Blank spreadsheet"
                    description="Start with an empty sheet"
                    isDark={isDark}
                    accent={accent}
                    onClick={() =>
                      runDashboardAction(
                        "new-spreadsheet"
                      )
                    }
                  />

                  <SubmenuButton
                    icon={Sheet}
                    label="From template"
                    description="Choose a template"
                    isDark={isDark}
                    accent={accent}
                    borderTop
                    onClick={() =>
                      runDashboardAction(
                        "new-spreadsheet-template"
                      )
                    }
                  />
                </div>
              )}
            </div>

            <div className="relative">
              <ExpandableMenuButton
                icon={Presentation}
                label="New presentation"
                expanded={
                  activeSubmenu ===
                  "presentation"
                }
                isDark={isDark}
                onClick={() =>
                  setActiveSubmenu(
                    (current) =>
                      current ===
                      "presentation"
                        ? null
                        : "presentation"
                  )
                }
              />

              {activeSubmenu ===
                "presentation" && (
                <div
                  className={`
                    absolute
                    left-[calc(100%+12px)]
                    top-0
                    z-[160]
                    w-[250px]
                    overflow-hidden
                    rounded-2xl
                    border
                    shadow-2xl
                    ${
                      isDark
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }
                  `}
                >
                  <SubmenuButton
                    icon={Presentation}
                    label="Blank presentation"
                    description="Start with a blank deck"
                    isDark={isDark}
                    accent={accent}
                    onClick={() =>
                      runDashboardAction(
                        "new-presentation"
                      )
                    }
                  />

                  <SubmenuButton
                    icon={Presentation}
                    label="From template"
                    description="Choose a template"
                    isDark={isDark}
                    accent={accent}
                    borderTop
                    onClick={() =>
                      runDashboardAction(
                        "new-presentation-template"
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-4" />

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-col gap-1">
          {menuItems.map(
            (item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              const isTrash = item.path === "/trash";
              const isStarred = item.path === "/starred";
              const isProjects = item.path === "/projects";

              const trashHighlighted = isTrash && trashDropActive;
              const starredHighlighted = isStarred && starredDropActive;
              const projectsHighlighted = isProjects && projectsDropActive;
              const dragHighlighted =
                trashHighlighted ||
                starredHighlighted ||
                projectsHighlighted;

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      item.path
                    )
                  }
                  onDragEnter={
                    isTrash
                      ? handleTrashDragEnter
                      : isStarred
                        ? handleStarredDragEnter
                        : isProjects
                          ? handleProjectsDragEnter
                          : undefined
                  }
                  onDragOver={
                    isTrash
                      ? handleTrashDragOver
                      : isStarred
                        ? handleStarredDragOver
                        : isProjects
                          ? handleProjectsDragOver
                          : undefined
                  }
                  onDragLeave={
                    isTrash
                      ? handleTrashDragLeave
                      : isStarred
                        ? handleStarredDragLeave
                        : isProjects
                          ? handleProjectsDragLeave
                          : undefined
                  }
                  onDrop={
                    isTrash
                      ? handleTrashDrop
                      : isStarred
                        ? handleStarredDrop
                        : isProjects
                          ? handleProjectsDrop
                          : undefined
                  }
                  className={`
                    group
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2
                    text-left
                    text-sm
                    font-medium
                    transition-all
                    ${
                      trashHighlighted
                        ? isDark
                          ? "bg-red-500/15 text-red-300 ring-2 ring-inset ring-red-500/50"
                          : "bg-red-50 text-red-600 ring-2 ring-inset ring-red-300"
                        : starredHighlighted
                          ? isDark
                            ? "bg-amber-500/15 text-amber-300 ring-2 ring-inset ring-amber-500/50"
                            : "bg-amber-50 text-amber-600 ring-2 ring-inset ring-amber-300"
                          : projectsHighlighted
                            ? isDark
                              ? "bg-violet-500/15 text-violet-300 ring-2 ring-inset ring-violet-500/50"
                              : "bg-violet-50 text-violet-600 ring-2 ring-inset ring-violet-300"
                            : active
                          ? ""
                          : isDark
                            ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                  style={
                    dragHighlighted
                      ? undefined
                      : active
                        ? {
                            color:
                              accent.primary,
                            backgroundColor:
                              isDark
                                ? "#1e293b"
                                : accent.soft,
                          }
                        : undefined
                  }
                >
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${
                        trashHighlighted
                          ? isDark
                            ? "bg-red-500/20"
                            : "bg-red-100"
                          : starredHighlighted
                            ? isDark
                              ? "bg-amber-500/20"
                              : "bg-amber-100"
                            : projectsHighlighted
                              ? isDark
                                ? "bg-violet-500/20"
                                : "bg-violet-100"
                              : active
                            ? isDark
                              ? "bg-slate-700"
                              : "bg-white shadow-sm"
                            : ""
                      }
                    `}
                  >
                    <Icon size={17} />
                  </div>

                  <span className="truncate">
                    {isTrash && trashingSidebarItems
                      ? "Moving..."
                      : isStarred && starringSidebarItems
                        ? "Starring..."
                        : item.label}
                  </span>

                  {trashHighlighted && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">
                      Drop
                    </span>
                  )}

                  {starredHighlighted && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">
                      Star
                    </span>
                  )}

                  {projectsHighlighted && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">
                      Open
                    </span>
                  )}

                  {active &&
                    !dragHighlighted && (
                    <span
                      className="ml-auto h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          accent.primary,
                      }}
                    />
                  )}
                </button>
              );
            }
          )}
        </div>

        <div
          className={`my-4 border-t ${
            isDark
              ? "border-slate-800"
              : "border-slate-100"
          }`}
        />

        <button
          type="button"
          onClick={onOpenSettings}
          className={`
            group
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2
            text-left
            text-sm
            font-medium
            transition
            ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }
          `}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg">
            <Settings size={18} />
          </div>

          <span>
            Settings
          </span>
        </button>
      </nav>

      <div
        className={`border-t px-5 pb-4 pt-4 ${
          isDark
            ? "border-slate-800"
            : "border-slate-100"
        }`}
      >
        <button
          type="button"
          onClick={() =>
            handleNavigate(
              "/storage"
            )
          }
          className="w-full text-left"
        >
          <div className="mb-2.5 flex items-center justify-between gap-3 text-xs">
            <span
              className={
                isActive("/storage")
                  ? "font-bold"
                  : isDark
                    ? "font-semibold text-slate-400"
                    : "font-semibold text-slate-600"
              }
              style={
                isActive("/storage")
                  ? {
                      color:
                        accent.primary,
                    }
                  : undefined
              }
            >
              Storage
            </span>

            {!storageLoading &&
              storage && (
                <span className="text-slate-400">
                  {storagePercentage.toFixed(
                    storagePercentage < 1
                      ? 2
                      : 1
                  )}
                  %
                </span>
              )}
          </div>

          <div
            className={`h-2 overflow-hidden rounded-full ${
              isDark
                ? "bg-slate-800"
                : "bg-slate-100"
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width:
                  `${storagePercentage}%`,
                minWidth:
                  storagePercentage > 0
                    ? "3px"
                    : "0",
                background:
                  storageFull
                    ? "#ef4444"
                    : `linear-gradient(90deg, ${accent.secondary}, ${accent.primary})`,
              }}
            />
          </div>

          {storageLoading ? (
            <p className="mt-2.5 text-xs text-slate-400">
              Calculating storage...
            </p>
          ) : storage ? (
            <p
              className={`mt-2.5 text-xs ${
                storageFull
                  ? "font-semibold text-red-500"
                  : "text-slate-400"
              }`}
            >
              {storageUsed} of{" "}
              {storageQuota} used
            </p>
          ) : (
            <p className="mt-2.5 text-xs text-slate-400">
              Storage unavailable
            </p>
          )}
        </button>
      </div>
    </aside>
  );
}

function NewMenuButton({
  icon: Icon,
  label,
  onClick,
  isDark,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        gap-3
        px-4
        py-3
        text-left
        text-sm
        font-medium
        transition
        ${
          isDark
            ? "text-slate-300 hover:bg-slate-700"
            : "text-slate-700 hover:bg-slate-50"
        }
      `}
    >
      <Icon
        size={19}
        className="shrink-0 text-slate-500"
      />

      <span className="truncate">
        {label}
      </span>
    </button>
  );
}

function ExpandableMenuButton({
  icon: Icon,
  label,
  expanded,
  onClick,
  isDark,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        gap-3
        px-4
        py-3
        text-left
        text-sm
        font-medium
        transition
        ${
          isDark
            ? "text-slate-300 hover:bg-slate-700"
            : "text-slate-700 hover:bg-slate-50"
        }
      `}
    >
      <Icon
        size={19}
        className="shrink-0 text-slate-500"
      />

      <span className="min-w-0 flex-1 truncate">
        {label}
      </span>

      {expanded ? (
        <ChevronDown
          size={17}
          className="text-slate-400"
        />
      ) : (
        <ChevronRight
          size={17}
          className="text-slate-400"
        />
      )}
    </button>
  );
}

function SubmenuButton({
  icon: Icon,
  label,
  description,
  isDark,
  accent,
  borderTop = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        gap-3
        px-4
        py-3
        text-left
        transition
        ${
          borderTop
            ? isDark
              ? "border-t border-slate-700"
              : "border-t border-slate-100"
            : ""
        }
        ${
          isDark
            ? "hover:bg-slate-800"
            : "hover:bg-slate-50"
        }
      `}
    >
      <Icon
        size={18}
        style={{
          color:
            accent.primary,
        }}
      />

      <div className="min-w-0">
        <p
          className={`truncate text-sm font-medium ${
            isDark
              ? "text-slate-200"
              : "text-slate-700"
          }`}
        >
          {label}
        </p>

        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          {description}
        </p>
      </div>
    </button>
  );
}

function MenuDivider({
  isDark,
}) {
  return (
    <div
      className={`my-2 border-t ${
        isDark
          ? "border-slate-700"
          : "border-slate-100"
      }`}
    />
  );
}

export default Sidebar;