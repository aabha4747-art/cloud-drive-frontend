import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, HardDrive, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../api/axios";
import DriveDropOverlay from "../components/DriveDropOverlay";
import useDriveDragDrop from "../hooks/useDriveDragDrop";
import { getItemDisplayName, getItemTypeConfig, getItemTypeKey } from "../utils/fileTypeConfig";

// ======================================================
// HELPERS
// ======================================================

const formatBytes = (bytes) => {
  const value =
    Number(bytes) || 0;

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
      : size >= 10
        ? 1
        : 2
  )} ${units[index]}`;
};

const formatDate = (
  dateString
) => {
  if (!dateString) {
    return "—";
  }

  const date =
    new Date(dateString);

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
      year: "numeric",
    }
  );
};

// ======================================================
// CATEGORY CONFIG
// ======================================================

const getCategoryConfig = (
  category
) => {
  const configs = {
    documents: {
      label: "Documents",
      type: "document",
      sample: {
        name: "Document.txt",
        fileKind:
          "document",
      },
    },

    images: {
      label: "Images",
      type: "image",
      sample: {
        name: "image.png",
        mimeType:
          "image/png",
      },
    },

    videos: {
      label: "Videos",
      type: "video",
      sample: {
        name: "video.mp4",
        mimeType:
          "video/mp4",
      },
    },

    audio: {
      label: "Audio",
      type: "audio",
      sample: {
        name: "audio.mp3",
        mimeType:
          "audio/mpeg",
      },
    },

    archives: {
      label: "Archives",
      type: "archive",
      sample: {
        name: "archive.zip",
        mimeType:
          "application/zip",
      },
    },

    other: {
      label: "Other",
      type: "other",
      sample: {
        name: "file.bin",
      },
    },
  };

  return (
    configs[category] ||
    configs.other
  );
};

// ======================================================
// PAGE
// ======================================================

function StoragePage() {
  const navigate =
    useNavigate();

  const { settings } =
    useOutletContext();

  const [
    storage,
    setStorage,
  ] = useState(null);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    largestFiles,
    setLargestFiles,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    sortBy,
    setSortBy,
  ] = useState(
    "size-desc"
  );

  const [
    systemDark,
    setSystemDark,
  ] = useState(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return false;
    }

    return window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
  });

  // ======================================================
  // DARK MODE
  // ======================================================

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleChange = (
      event
    ) => {
      setSystemDark(
        event.matches
      );
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
    settings?.theme ===
      "dark" ||
    (
      settings?.theme ===
        "system" &&
      systemDark
    );

  // ======================================================
  // FETCH STORAGE
  // ======================================================

  const fetchStorage =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          setError("");

          if (refresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(true);
          }

          const response =
            await api.get(
              "/storage/summary"
            );

          setStorage(
            response.data
              ?.storage ||
              null
          );

          setCategories(
            response.data
              ?.categories ||
              []
          );

          setLargestFiles(
            response.data
              ?.largestFiles ||
              []
          );
        } catch (err) {
          console.error(
            "Unable to fetch storage:",
            err
          );

          setError(
            err.response?.data
              ?.error?.message ||
              err.response?.data
                ?.message ||
              "Unable to load storage information."
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  // ======================================================
  // LIVE STORAGE REFRESH
  // ======================================================

  useEffect(() => {
    const handleStorageChanged =
      () => {
        fetchStorage(true);
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

  // ======================================================
  // SORT FILES
  // ======================================================

  const sortedFiles =
    useMemo(() => {
      const files = [
        ...largestFiles,
      ];

      switch (sortBy) {
        case "size-asc":
          return files.sort(
            (a, b) =>
              Number(
                a.sizeBytes
              ) -
              Number(
                b.sizeBytes
              )
          );

        case "name-asc":
          return files.sort(
            (a, b) =>
              String(
                a.name || ""
              ).localeCompare(
                String(
                  b.name || ""
                )
              )
          );

        case "name-desc":
          return files.sort(
            (a, b) =>
              String(
                b.name || ""
              ).localeCompare(
                String(
                  a.name || ""
                )
              )
          );

        case "date-desc":
          return files.sort(
            (a, b) =>
              new Date(
                b.updatedAt ||
                  b.createdAt ||
                  0
              ) -
              new Date(
                a.updatedAt ||
                  a.createdAt ||
                  0
              )
          );

        case "date-asc":
          return files.sort(
            (a, b) =>
              new Date(
                a.updatedAt ||
                  a.createdAt ||
                  0
              ) -
              new Date(
                b.updatedAt ||
                  b.createdAt ||
                  0
              )
          );

        case "size-desc":
        default:
          return files.sort(
            (a, b) =>
              Number(
                b.sizeBytes
              ) -
              Number(
                a.sizeBytes
              )
          );
      }
    }, [
      largestFiles,
      sortBy,
    ]);

  // ======================================================
  // OPEN FILE
  // ======================================================

  const handleOpenFile =
    async (file) => {
      if (file.isDeleted) {
        navigate(
          "/trash"
        );

        return;
      }

      const fileType =
        getItemTypeKey(
          file,
          "file"
        );

      if (
        fileType ===
        "document"
      ) {
        navigate(
          `/documents/${file.id}`,
          {
            state: {
              returnTo:
                "/storage",
            },
          }
        );

        return;
      }

      if (
        fileType ===
        "spreadsheet"
      ) {
        navigate(
          `/spreadsheets/${file.id}`,
          {
            state: {
              returnTo:
                "/storage",
            },
          }
        );

        return;
      }

      if (
        fileType ===
        "presentation"
      ) {
        navigate(
          `/presentations/${file.id}`,
          {
            state: {
              returnTo:
                "/storage",
            },
          }
        );

        return;
      }

      try {
        setError("");

        const response =
          await api.get(
            `/files/${file.id}`
          );

        const fileUrl =
          response.data
            ?.signedUrl ||
          response.data
            ?.downloadUrl ||
          response.data?.url ||
          response.data?.file
            ?.signedUrl ||
          response.data?.file
            ?.downloadUrl ||
          response.data?.file
            ?.url;

        if (!fileUrl) {
          throw new Error(
            "File URL not returned"
          );
        }

        window.open(
          fileUrl,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (err) {
        console.error(
          "Unable to open file:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to open this file."
        );
      }
    };

  // ======================================================
  // STORAGE PAGE DRAG & DROP
  // ======================================================

  const uploadDroppedItemsToRoot = useCallback(
    async (droppedItems) => {
      if (!droppedItems?.length) return;

      setError("");

      try {
        const hasFolderStructure = droppedItems.some(
          ({ relativePath, file }) =>
            relativePath &&
            relativePath !== file?.name &&
            relativePath.includes("/")
        );

        if (hasFolderStructure) {
          const formData = new FormData();
          const relativePaths = [];

          droppedItems.forEach(({ file, relativePath }) => {
            formData.append("files", file);
            relativePaths.push(relativePath || file.name);
          });

          formData.append("relativePaths", JSON.stringify(relativePaths));

          await api.post("/files/upload-folder", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          for (const { file } of droppedItems) {
            const formData = new FormData();
            formData.append("file", file);

            await api.post("/files/upload", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          }
        }

        window.dispatchEvent(new Event("cloud-drive-storage-changed"));
        window.dispatchEvent(new Event("cloud-drive-items-changed"));
        await fetchStorage(true);
      } catch (err) {
        console.error("Unable to upload dropped items:", err);

        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "Unable to upload the dropped files."
        );
      }
    },
    [fetchStorage]
  );

  const moveDroppedItemsToRoot = useCallback(
    async (items) => {
      if (!items?.length) return;

      setError("");

      const operations = items.map((entry) => {
        const resourceType = entry.resourceType;
        const id = entry.id ?? entry.item?.id;

        if (!id) {
          return Promise.reject(new Error("Dropped item has no id."));
        }

        if (resourceType === "folder" || resourceType === "project") {
          return api.patch(`/folders/${id}`, {
            parentId: null,
          });
        }

        return api.patch(`/files/${id}`, {
          folderId: null,
        });
      });

      const results = await Promise.allSettled(operations);
      const failures = results.filter(
        (result) => result.status === "rejected"
      );

      window.dispatchEvent(new Event("cloud-drive-storage-changed"));
      window.dispatchEvent(new Event("cloud-drive-items-changed"));
      await fetchStorage(true);

      if (failures.length) {
        setError(
          failures.length === items.length
            ? "Unable to move the dropped items to My Drive."
            : `${failures.length} item${failures.length === 1 ? "" : "s"} could not be moved.`
        );
      }
    },
    [fetchStorage]
  );

  const {
    dropZoneProps,
    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop,
  } = useDriveDragDrop({
    onExternalDrop: uploadDroppedItemsToRoot,
    onInternalDrop: moveDroppedItemsToRoot,
  });

  // ======================================================
  // CALCULATIONS
  // ======================================================

  const percentageUsed =
    Math.min(
      Math.max(
        Number(
          storage
            ?.percentageUsed
        ) || 0,
        0
      ),
      100
    );

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div
        className={`min-h-screen p-8 transition-colors ${
          isDark
            ? "bg-slate-950"
            : "bg-[#F6F8FC]"
        }`}
      >

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <RefreshCw
              size={34}
              className="mx-auto animate-spin text-violet-500"
            />

            <p
              className={`mt-4 text-sm font-medium ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Calculating storage...
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
        visible={isExternalDragActive || isInternalDragActive}
        processing={isProcessingDrop}
        mode={isInternalDragActive ? "move" : "upload"}
        title={
          isInternalDragActive
            ? "Drop to move to My Drive"
            : "Drop to upload to My Drive"
        }
        description={
          isInternalDragActive
            ? "Storage is a view, not a folder. These Cloud Drive items will be moved to My Drive root."
            : "Storage is a view, not a folder. Files and folders from your computer will be uploaded to My Drive root."
        }
      />

      <div className="mx-auto max-w-[1500px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-5">

          <div>

            <h1
              className={`text-4xl font-bold tracking-tight ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-950"
              }`}
            >
              Storage
            </h1>

            <p
              className={`mt-2 text-base ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Manage your Cloud Drive storage and find files using the most space.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              fetchStorage(
                true
              )
            }
            disabled={
              refreshing
            }
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

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className={`mt-7 rounded-2xl border px-5 py-4 text-sm font-medium ${
              isDark
                ? "border-red-500/20 bg-red-500/10 text-red-300"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        {/* ==================================================
            STORAGE OVERVIEW
        ================================================== */}

        {storage && (
          <>

            <section
              className={`mt-8 rounded-[28px] border p-7 shadow-sm transition-colors lg:p-9 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >

              <div className="flex flex-wrap items-start justify-between gap-6">

                <div className="flex items-start gap-5">

                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                      isDark
                        ? "bg-violet-500/15 text-violet-400"
                        : "bg-violet-50 text-violet-600"
                    }`}
                  >
                    <HardDrive
                      size={30}
                    />
                  </div>

                  <div>

                    <p
                      className={`text-sm font-semibold uppercase tracking-[0.18em] ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-400"
                      }`}
                    >
                      Storage used
                    </p>

                    <h2
                      className={`mt-2 text-3xl font-bold ${
                        isDark
                          ? "text-slate-100"
                          : "text-slate-900"
                      }`}
                    >
                      {formatBytes(
                        storage.usedBytes
                      )}

                      <span
                        className={`ml-2 text-lg font-medium ${
                          isDark
                            ? "text-slate-400"
                            : "text-slate-400"
                        }`}
                      >
                        of{" "}
                        {formatBytes(
                          storage.quotaBytes
                        )}
                      </span>

                    </h2>

                    <p
                      className={`mt-2 text-sm ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {formatBytes(
                        storage.availableBytes
                      )}{" "}
                      available
                    </p>

                  </div>

                </div>

                <div
                  className={`rounded-2xl px-5 py-4 text-right ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-50"
                  }`}
                >

                  <p
                    className={`text-sm font-medium ${
                      isDark
                        ? "text-slate-400"
                        : "text-slate-400"
                    }`}
                  >
                    Used
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      isDark
                        ? "text-slate-100"
                        : "text-slate-800"
                    }`}
                  >
                    {percentageUsed.toFixed(
                      2
                    )}
                    %
                  </p>

                </div>

              </div>

              {/* PROGRESS BAR */}

              <div className="mt-8">

                <div
                  className={`h-4 overflow-hidden rounded-full ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-100"
                  }`}
                >

                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{
                      width:
                        `${percentageUsed}%`,
                    }}
                  />

                </div>

              </div>

              {/* STORAGE STATS */}

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StorageStatCard
                  label="Active files"
                  value={formatBytes(
                    storage.active
                      ?.bytes
                  )}
                  subtext={`${storage.active?.fileCount || 0} files`}
                  isDark={
                    isDark
                  }
                />

                <StorageStatCard
                  label="Trash"
                  value={formatBytes(
                    storage.trash
                      ?.bytes
                  )}
                  subtext={`${storage.trash?.fileCount || 0} files`}
                  isDark={
                    isDark
                  }
                />

                <StorageStatCard
                  label="Total files"
                  value={
                    storage.totalFileCount ||
                    0
                  }
                  isDark={
                    isDark
                  }
                />

                <StorageStatCard
                  label="Available"
                  value={formatBytes(
                    storage.availableBytes
                  )}
                  isDark={
                    isDark
                  }
                />

              </div>

            </section>

            {/* ==================================================
                STORAGE BY TYPE
            ================================================== */}

            <section className="mt-10">

              <div className="mb-5">

                <h2
                  className={`text-xl font-bold ${
                    isDark
                      ? "text-slate-100"
                      : "text-slate-900"
                  }`}
                >
                  Storage by type
                </h2>

                <p
                  className={`mt-1 text-sm ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  See which kinds of files are using your storage.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {categories.map(
                  (category) => (
                    <StorageCategoryCard
                      key={
                        category.category
                      }
                      category={
                        category
                      }
                      isDark={
                        isDark
                      }
                    />
                  )
                )}

              </div>

            </section>

            {/* ==================================================
                LARGE FILES
            ================================================== */}

            <section
              className={`mt-10 rounded-[28px] border p-6 shadow-sm transition-colors lg:p-8 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <h2
                    className={`text-xl font-bold ${
                      isDark
                        ? "text-slate-100"
                        : "text-slate-900"
                    }`}
                  >
                    Files using the most storage
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      isDark
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    Large files are shown first so you can quickly free space.
                  </p>

                </div>

                <div className="relative">

                  <ArrowDownUp
                    size={17}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  />

                  <select
                    value={
                      sortBy
                    }
                    onChange={(
                      event
                    ) =>
                      setSortBy(
                        event.target
                          .value
                      )
                    }
                    className={`h-11 rounded-xl border pl-10 pr-9 text-sm font-semibold outline-none transition focus:border-violet-400 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-200"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >

                    <option value="size-desc">
                      Largest first
                    </option>

                    <option value="size-asc">
                      Smallest first
                    </option>

                    <option value="name-asc">
                      Name A-Z
                    </option>

                    <option value="name-desc">
                      Name Z-A
                    </option>

                    <option value="date-desc">
                      Newest first
                    </option>

                    <option value="date-asc">
                      Oldest first
                    </option>

                  </select>

                </div>

              </div>

              {/* TABLE HEADER */}

              <div
                className={`mt-7 hidden grid-cols-[minmax(0,1fr)_160px_150px_150px] gap-5 border-b px-4 pb-3 text-xs font-bold uppercase tracking-[0.15em] md:grid ${
                  isDark
                    ? "border-slate-800 text-slate-500"
                    : "border-slate-100 text-slate-400"
                }`}
              >

                <div>
                  Name
                </div>

                <div>
                  Size
                </div>

                <div>
                  Status
                </div>

                <div>
                  Modified
                </div>

              </div>

              {/* FILES */}

              <div>

                {sortedFiles.length ===
                0 ? (
                  <div className="py-16 text-center">

                    <HardDrive
                      size={42}
                      className={`mx-auto ${
                        isDark
                          ? "text-slate-700"
                          : "text-slate-300"
                      }`}
                    />

                    <p
                      className={`mt-4 font-semibold ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      No files are using storage yet.
                    </p>

                  </div>
                ) : (
                  sortedFiles.map(
                    (file) => (
                      <StorageFileRow
                        key={
                          file.id
                        }
                        file={
                          file
                        }
                        isDark={
                          isDark
                        }
                        onOpen={
                          handleOpenFile
                        }
                      />
                    )
                  )
                )}

              </div>

            </section>

          </>
        )}

      </div>

    </div>
  );
}

// ======================================================
// STORAGE STAT CARD
// ======================================================

function StorageStatCard({
  label,
  value,
  subtext,
  isDark,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        isDark
          ? "border-slate-700/60 bg-slate-800"
          : "border-transparent bg-slate-50"
      }`}
    >

      <p
        className={`text-sm font-medium ${
          isDark
            ? "text-slate-400"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          isDark
            ? "text-slate-100"
            : "text-slate-800"
        }`}
      >
        {value}
      </p>

      {subtext && (
        <p
          className={`mt-1 text-sm ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {subtext}
        </p>
      )}

    </div>
  );
}

// ======================================================
// STORAGE CATEGORY CARD
// ======================================================

function StorageCategoryCard({
  category,
  isDark,
}) {
  const categoryConfig =
    getCategoryConfig(
      category.category
    );

  const typeConfig =
    getItemTypeConfig(
      categoryConfig.sample,
      "file"
    );

  const colors =
    isDark
      ? typeConfig.dark
      : typeConfig.light;

  const Icon =
    typeConfig.icon;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isDark
          ? `bg-slate-900 ${colors.border}`
          : `bg-white ${colors.border}`
      }`}
    >

      <div className="flex items-center justify-between gap-4">

        <div className="flex min-w-0 items-center gap-4">

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
          >
            <Icon
              size={23}
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">

            <p
              className={`font-bold ${
                isDark
                  ? "text-slate-100"
                  : "text-slate-800"
              }`}
            >
              {categoryConfig.label}
            </p>

            <p
              className={`mt-1 text-sm ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {category.count}{" "}
              {category.count === 1
                ? "file"
                : "files"}
            </p>

          </div>

        </div>

        <div className="shrink-0 text-right">

          <p
            className={`font-bold ${
              isDark
                ? "text-slate-100"
                : "text-slate-800"
            }`}
          >
            {formatBytes(
              category.bytes
            )}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            {Number(
              category.percentage ||
                0
            ).toFixed(1)}
            %
          </p>

        </div>

      </div>

      {/* CATEGORY USAGE BAR */}

      <div
        className={`mt-4 h-1.5 overflow-hidden rounded-full ${
          isDark
            ? "bg-slate-800"
            : "bg-slate-100"
        }`}
      >

        <div
          className={`h-full rounded-full ${colors.icon.replace(
            "text-",
            "bg-"
          )}`}
          style={{
            width: `${Math.min(
              Math.max(
                Number(
                  category.percentage ||
                    0
                ),
                0
              ),
              100
            )}%`,
          }}
        />

      </div>

    </div>
  );
}

// ======================================================
// STORAGE FILE ROW
// ======================================================

function StorageFileRow({
  file,
  isDark,
  onOpen,
}) {
  const typeConfig =
    getItemTypeConfig(
      file,
      "file"
    );

  const colors =
    isDark
      ? typeConfig.dark
      : typeConfig.light;

  const Icon =
    typeConfig.icon;

  const displayName =
    getItemDisplayName(
      file
    );

  return (
    <button
      type="button"
      onClick={() =>
        onOpen(file)
      }
      className={`grid w-full grid-cols-1 gap-3 border-b px-4 py-4 text-left transition last:border-b-0 md:grid-cols-[minmax(0,1fr)_160px_150px_150px] md:items-center md:gap-5 ${
        isDark
          ? "border-slate-800 hover:bg-slate-800/70"
          : "border-slate-100 hover:bg-slate-50"
      }`}
    >

      {/* NAME */}

      <div className="flex min-w-0 items-center gap-3">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.iconBox}`}
        >
          <Icon
            size={21}
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

          <div className="mt-1 flex items-center gap-2">

            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.06em] ${colors.badge}`}
            >
              {typeConfig.badge}
            </span>

            <span
              className={`text-xs ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {typeConfig.label}
            </span>

          </div>

        </div>

      </div>

      {/* SIZE */}

      <div
        className={`text-sm font-semibold ${
          isDark
            ? "text-slate-300"
            : "text-slate-600"
        }`}
      >

        <span
          className={`mr-2 text-xs font-medium md:hidden ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          Size:
        </span>

        {formatBytes(
          file.sizeBytes
        )}

      </div>

      {/* STATUS */}

      <div>

        {file.isDeleted ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isDark
                ? "bg-red-500/15 text-red-300"
                : "bg-red-50 text-red-600"
            }`}
          >

            <Trash2
              size={13}
            />

            Trash

          </span>
        ) : (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              isDark
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            Active
          </span>
        )}

      </div>

      {/* MODIFIED */}

      <div
        className={`text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-400"
        }`}
      >

        <span className="mr-2 text-xs font-medium md:hidden">
          Modified:
        </span>

        {formatDate(
          file.updatedAt ||
            file.createdAt
        )}

      </div>

    </button>
  );
}

export default StoragePage;