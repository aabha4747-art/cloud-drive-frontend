import {
  File,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderKanban,
  Presentation,
  Sheet,
} from "lucide-react";

// ======================================================
// FILE EXTENSION
// ======================================================

export const getFileExtension = (
  name = ""
) => {
  const cleanName = String(
    name || ""
  )
    .trim()
    .toLowerCase();

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
};

// ======================================================
// NORMALIZE FILE KIND
// ======================================================

export const getFileKind = (
  item
) => {
  return (
    item?.fileKind ||
    item?.file_kind ||
    ""
  );
};

// ======================================================
// NORMALIZE MIME TYPE
// ======================================================

export const getMimeType = (
  item
) => {
  return String(
    item?.mimeType ||
      item?.mime_type ||
      ""
  ).toLowerCase();
};

// ======================================================
// DETECT FILE TYPE
// ======================================================

export const getItemTypeKey = (
  item,
  resourceType = "file"
) => {
  if (
    resourceType ===
    "folder"
  ) {
    const isProject =
      Boolean(
        item?.isProject ??
          item?.is_project
      );

    return isProject
      ? "project"
      : "folder";
  }

  const fileKind =
    getFileKind(item);

  const extension =
    getFileExtension(
      item?.name
    );

  const mimeType =
    getMimeType(item);

  // ==================================================
  // CLOUD DRIVE NATIVE TYPES
  // ==================================================

  if (
    fileKind ===
      "document"
  ) {
    return "document";
  }

  if (
    fileKind ===
      "spreadsheet" ||
    extension ===
      "cloudsheet"
  ) {
    return "spreadsheet";
  }

  if (
    fileKind ===
      "presentation" ||
    extension ===
      "cloudslides"
  ) {
    return "presentation";
  }

  // ==================================================
  // PDF
  // ==================================================

  if (
    extension ===
      "pdf" ||
    mimeType ===
      "application/pdf"
  ) {
    return "pdf";
  }

  // ==================================================
  // WORD
  // ==================================================

  if (
    [
      "doc",
      "docx",
      "docm",
      "dot",
      "dotx",
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
    ) ||
    mimeType.includes(
      "msword"
    )
  ) {
    return "word";
  }

  // ==================================================
  // EXCEL
  // ==================================================

  if (
    [
      "xls",
      "xlsx",
      "xlsm",
      "xlsb",
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
    mimeType.includes(
      "ms-excel"
    ) ||
    mimeType ===
      "text/csv"
  ) {
    return "excel";
  }

  // ==================================================
  // POWERPOINT
  // ==================================================

  if (
    [
      "ppt",
      "pptx",
      "pptm",
      "pps",
      "ppsx",
      "odp",
    ].includes(
      extension
    ) ||
    mimeType.includes(
      "powerpoint"
    ) ||
    mimeType.includes(
      "presentationml"
    ) ||
    mimeType.includes(
      "ms-powerpoint"
    )
  ) {
    return "powerpoint";
  }

  // ==================================================
  // IMAGE
  // ==================================================

  if (
    [
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
      "heif",
      "ico",
    ].includes(
      extension
    ) ||
    mimeType.startsWith(
      "image/"
    )
  ) {
    return "image";
  }

  // ==================================================
  // VIDEO
  // ==================================================

  if (
    [
      "mp4",
      "mov",
      "avi",
      "mkv",
      "webm",
      "m4v",
      "mpeg",
      "mpg",
      "wmv",
      "flv",
    ].includes(
      extension
    ) ||
    mimeType.startsWith(
      "video/"
    )
  ) {
    return "video";
  }

  // ==================================================
  // AUDIO
  // ==================================================

  if (
    [
      "mp3",
      "wav",
      "m4a",
      "aac",
      "flac",
      "ogg",
      "wma",
    ].includes(
      extension
    ) ||
    mimeType.startsWith(
      "audio/"
    )
  ) {
    return "audio";
  }

  // ==================================================
  // ARCHIVE
  // ==================================================

  if (
    [
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
      "bz2",
      "xz",
    ].includes(
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
    ) ||
    mimeType.includes(
      "rar"
    )
  ) {
    return "archive";
  }

  // ==================================================
  // CODE
  // ==================================================

  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "cc",
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
      "vue",
    ].includes(
      extension
    )
  ) {
    return "code";
  }

  // ==================================================
  // TEXT
  // ==================================================

  if (
    [
      "txt",
      "md",
      "log",
    ].includes(
      extension
    ) ||
    mimeType.startsWith(
      "text/"
    )
  ) {
    return "text";
  }

  return "other";
};

// ======================================================
// TYPE BADGE
// ======================================================

const getBadgeText = (
  type,
  item
) => {
  const extension =
    getFileExtension(
      item?.name
    );

  switch (type) {
    case "folder":
      return "FOLDER";

    case "project":
      return "PROJECT";

    case "document":
      return "DOC";

    case "spreadsheet":
      return "SHEET";

    case "presentation":
      return "SLIDES";

    case "pdf":
      return "PDF";

    case "word":
      return (
        extension.toUpperCase() ||
        "DOCX"
      );

    case "excel":
      return (
        extension.toUpperCase() ||
        "XLSX"
      );

    case "powerpoint":
      return (
        extension.toUpperCase() ||
        "PPTX"
      );

    case "image":
      return (
        extension.toUpperCase() ||
        "IMAGE"
      );

    case "video":
      return (
        extension.toUpperCase() ||
        "VIDEO"
      );

    case "audio":
      return (
        extension.toUpperCase() ||
        "AUDIO"
      );

    case "archive":
      return (
        extension.toUpperCase() ||
        "ZIP"
      );

    case "text":
      return (
        extension.toUpperCase() ||
        "TXT"
      );

    case "code":
      return (
        extension.toUpperCase() ||
        "CODE"
      );

    default:
      return (
        extension.toUpperCase() ||
        "FILE"
      );
  }
};

// ======================================================
// SHARED VISUAL CONFIG
// ======================================================

export const getItemTypeConfig = (
  item,
  resourceType = "file"
) => {
  const type =
    getItemTypeKey(
      item,
      resourceType
    );

  const badge =
    getBadgeText(
      type,
      item
    );

  switch (type) {
    // ==================================================
    // FOLDER
    // ==================================================

    case "folder":
      return {
        key: type,
        label: "Folder",
        badge,
        icon: Folder,

        light: {
          icon:
            "text-amber-600",

          iconBox:
            "bg-amber-50 text-amber-600",

          badge:
            "bg-amber-100 text-amber-700",

          preview:
            "from-amber-50 via-yellow-50 to-orange-50",

          border:
            "border-amber-100 hover:border-amber-300",
        },

        dark: {
          icon:
            "text-amber-400",

          iconBox:
            "bg-amber-500/15 text-amber-400",

          badge:
            "bg-amber-500/15 text-amber-300",

          preview:
            "from-amber-500/10 via-yellow-500/5 to-slate-900",

          border:
            "border-amber-500/20 hover:border-amber-400/50",
        },
      };

    // ==================================================
    // PROJECT
    // ==================================================

    case "project":
      return {
        key: type,
        label: "Project",
        badge,
        icon:
          FolderKanban,

        light: {
          icon:
            "text-violet-600",

          iconBox:
            "bg-violet-50 text-violet-600",

          badge:
            "bg-violet-100 text-violet-700",

          preview:
            "from-violet-50 via-purple-50 to-indigo-50",

          border:
            "border-violet-100 hover:border-violet-300",
        },

        dark: {
          icon:
            "text-violet-400",

          iconBox:
            "bg-violet-500/15 text-violet-400",

          badge:
            "bg-violet-500/15 text-violet-300",

          preview:
            "from-violet-500/10 via-purple-500/5 to-slate-900",

          border:
            "border-violet-500/20 hover:border-violet-400/50",
        },
      };

    // ==================================================
    // CLOUD DOCUMENT
    // ==================================================

    case "document":
      return {
        key: type,
        label:
          "Cloud Document",
        badge,
        icon:
          FileText,

        light: {
          icon:
            "text-indigo-600",

          iconBox:
            "bg-indigo-50 text-indigo-600",

          badge:
            "bg-indigo-100 text-indigo-700",

          preview:
            "from-indigo-50 via-violet-50 to-purple-50",

          border:
            "border-indigo-100 hover:border-indigo-300",
        },

        dark: {
          icon:
            "text-indigo-400",

          iconBox:
            "bg-indigo-500/15 text-indigo-400",

          badge:
            "bg-indigo-500/15 text-indigo-300",

          preview:
            "from-indigo-500/10 via-violet-500/5 to-slate-900",

          border:
            "border-indigo-500/20 hover:border-indigo-400/50",
        },
      };

    // ==================================================
    // CLOUD SPREADSHEET
    // ==================================================

    case "spreadsheet":
      return {
        key: type,
        label:
          "Cloud Spreadsheet",
        badge,
        icon:
          Sheet,

        light: {
          icon:
            "text-emerald-600",

          iconBox:
            "bg-emerald-50 text-emerald-600",

          badge:
            "bg-emerald-100 text-emerald-700",

          preview:
            "from-emerald-50 via-green-50 to-teal-50",

          border:
            "border-emerald-100 hover:border-emerald-300",
        },

        dark: {
          icon:
            "text-emerald-400",

          iconBox:
            "bg-emerald-500/15 text-emerald-400",

          badge:
            "bg-emerald-500/15 text-emerald-300",

          preview:
            "from-emerald-500/10 via-green-500/5 to-slate-900",

          border:
            "border-emerald-500/20 hover:border-emerald-400/50",
        },
      };

    // ==================================================
    // CLOUD PRESENTATION
    // ==================================================

    case "presentation":
      return {
        key: type,
        label:
          "Cloud Presentation",
        badge,
        icon:
          Presentation,

        light: {
          icon:
            "text-orange-600",

          iconBox:
            "bg-orange-50 text-orange-600",

          badge:
            "bg-orange-100 text-orange-700",

          preview:
            "from-orange-50 via-amber-50 to-yellow-50",

          border:
            "border-orange-100 hover:border-orange-300",
        },

        dark: {
          icon:
            "text-orange-400",

          iconBox:
            "bg-orange-500/15 text-orange-400",

          badge:
            "bg-orange-500/15 text-orange-300",

          preview:
            "from-orange-500/10 via-amber-500/5 to-slate-900",

          border:
            "border-orange-500/20 hover:border-orange-400/50",
        },
      };

    // ==================================================
    // PDF
    // ==================================================

    case "pdf":
      return {
        key: type,
        label: "PDF",
        badge,
        icon:
          FileText,

        light: {
          icon:
            "text-red-600",

          iconBox:
            "bg-red-50 text-red-600",

          badge:
            "bg-red-100 text-red-700",

          preview:
            "from-red-50 via-rose-50 to-orange-50",

          border:
            "border-red-100 hover:border-red-300",
        },

        dark: {
          icon:
            "text-red-400",

          iconBox:
            "bg-red-500/15 text-red-400",

          badge:
            "bg-red-500/15 text-red-300",

          preview:
            "from-red-500/10 via-rose-500/5 to-slate-900",

          border:
            "border-red-500/20 hover:border-red-400/50",
        },
      };

    // ==================================================
    // WORD
    // ==================================================

    case "word":
      return {
        key: type,
        label: "Word",
        badge,
        icon:
          FileText,

        light: {
          icon:
            "text-blue-600",

          iconBox:
            "bg-blue-50 text-blue-600",

          badge:
            "bg-blue-100 text-blue-700",

          preview:
            "from-blue-50 via-sky-50 to-indigo-50",

          border:
            "border-blue-100 hover:border-blue-300",
        },

        dark: {
          icon:
            "text-blue-400",

          iconBox:
            "bg-blue-500/15 text-blue-400",

          badge:
            "bg-blue-500/15 text-blue-300",

          preview:
            "from-blue-500/10 via-sky-500/5 to-slate-900",

          border:
            "border-blue-500/20 hover:border-blue-400/50",
        },
      };

    // ==================================================
    // EXCEL
    // ==================================================

    case "excel":
      return {
        key: type,
        label: "Excel",
        badge,
        icon:
          Sheet,

        light: {
          icon:
            "text-green-700",

          iconBox:
            "bg-green-50 text-green-700",

          badge:
            "bg-green-100 text-green-800",

          preview:
            "from-green-50 via-emerald-50 to-lime-50",

          border:
            "border-green-100 hover:border-green-300",
        },

        dark: {
          icon:
            "text-green-400",

          iconBox:
            "bg-green-500/15 text-green-400",

          badge:
            "bg-green-500/15 text-green-300",

          preview:
            "from-green-500/10 via-emerald-500/5 to-slate-900",

          border:
            "border-green-500/20 hover:border-green-400/50",
        },
      };

    // ==================================================
    // POWERPOINT
    // ==================================================

    case "powerpoint":
      return {
        key: type,
        label:
          "PowerPoint",
        badge,
        icon:
          Presentation,

        light: {
          icon:
            "text-orange-700",

          iconBox:
            "bg-orange-50 text-orange-700",

          badge:
            "bg-orange-100 text-orange-800",

          preview:
            "from-orange-50 via-amber-50 to-red-50",

          border:
            "border-orange-100 hover:border-orange-300",
        },

        dark: {
          icon:
            "text-orange-400",

          iconBox:
            "bg-orange-500/15 text-orange-400",

          badge:
            "bg-orange-500/15 text-orange-300",

          preview:
            "from-orange-500/10 via-red-500/5 to-slate-900",

          border:
            "border-orange-500/20 hover:border-orange-400/50",
        },
      };

    // ==================================================
    // IMAGE
    // ==================================================

    case "image":
      return {
        key: type,
        label: "Image",
        badge,
        icon:
          FileImage,

        light: {
          icon:
            "text-pink-600",

          iconBox:
            "bg-pink-50 text-pink-600",

          badge:
            "bg-pink-100 text-pink-700",

          preview:
            "from-pink-50 via-fuchsia-50 to-purple-50",

          border:
            "border-pink-100 hover:border-pink-300",
        },

        dark: {
          icon:
            "text-pink-400",

          iconBox:
            "bg-pink-500/15 text-pink-400",

          badge:
            "bg-pink-500/15 text-pink-300",

          preview:
            "from-pink-500/10 via-fuchsia-500/5 to-slate-900",

          border:
            "border-pink-500/20 hover:border-pink-400/50",
        },
      };

    // ==================================================
    // VIDEO
    // ==================================================

    case "video":
      return {
        key: type,
        label: "Video",
        badge,
        icon:
          FileVideo,

        light: {
          icon:
            "text-purple-600",

          iconBox:
            "bg-purple-50 text-purple-600",

          badge:
            "bg-purple-100 text-purple-700",

          preview:
            "from-purple-50 via-violet-50 to-indigo-50",

          border:
            "border-purple-100 hover:border-purple-300",
        },

        dark: {
          icon:
            "text-purple-400",

          iconBox:
            "bg-purple-500/15 text-purple-400",

          badge:
            "bg-purple-500/15 text-purple-300",

          preview:
            "from-purple-500/10 via-violet-500/5 to-slate-900",

          border:
            "border-purple-500/20 hover:border-purple-400/50",
        },
      };

    // ==================================================
    // AUDIO
    // ==================================================

    case "audio":
      return {
        key: type,
        label: "Audio",
        badge,
        icon:
          FileAudio,

        light: {
          icon:
            "text-cyan-600",

          iconBox:
            "bg-cyan-50 text-cyan-600",

          badge:
            "bg-cyan-100 text-cyan-700",

          preview:
            "from-cyan-50 via-sky-50 to-blue-50",

          border:
            "border-cyan-100 hover:border-cyan-300",
        },

        dark: {
          icon:
            "text-cyan-400",

          iconBox:
            "bg-cyan-500/15 text-cyan-400",

          badge:
            "bg-cyan-500/15 text-cyan-300",

          preview:
            "from-cyan-500/10 via-sky-500/5 to-slate-900",

          border:
            "border-cyan-500/20 hover:border-cyan-400/50",
        },
      };

    // ==================================================
    // ARCHIVE
    // ==================================================

    case "archive":
      return {
        key: type,
        label: "Archive",
        badge,
        icon:
          FileArchive,

        light: {
          icon:
            "text-yellow-700",

          iconBox:
            "bg-yellow-50 text-yellow-700",

          badge:
            "bg-yellow-100 text-yellow-800",

          preview:
            "from-yellow-50 via-amber-50 to-orange-50",

          border:
            "border-yellow-100 hover:border-yellow-300",
        },

        dark: {
          icon:
            "text-yellow-400",

          iconBox:
            "bg-yellow-500/15 text-yellow-400",

          badge:
            "bg-yellow-500/15 text-yellow-300",

          preview:
            "from-yellow-500/10 via-amber-500/5 to-slate-900",

          border:
            "border-yellow-500/20 hover:border-yellow-400/50",
        },
      };

    // ==================================================
    // TEXT
    // ==================================================

    case "text":
      return {
        key: type,
        label:
          "Text file",
        badge,
        icon:
          FileText,

        light: {
          icon:
            "text-sky-600",

          iconBox:
            "bg-sky-50 text-sky-600",

          badge:
            "bg-sky-100 text-sky-700",

          preview:
            "from-sky-50 via-blue-50 to-cyan-50",

          border:
            "border-sky-100 hover:border-sky-300",
        },

        dark: {
          icon:
            "text-sky-400",

          iconBox:
            "bg-sky-500/15 text-sky-400",

          badge:
            "bg-sky-500/15 text-sky-300",

          preview:
            "from-sky-500/10 via-blue-500/5 to-slate-900",

          border:
            "border-sky-500/20 hover:border-sky-400/50",
        },
      };

    // ==================================================
    // CODE
    // ==================================================

    case "code":
      return {
        key: type,
        label:
          "Code file",
        badge,
        icon:
          FileCode2,

        light: {
          icon:
            "text-slate-700",

          iconBox:
            "bg-slate-100 text-slate-700",

          badge:
            "bg-slate-200 text-slate-700",

          preview:
            "from-slate-100 via-slate-50 to-zinc-50",

          border:
            "border-slate-200 hover:border-slate-400",
        },

        dark: {
          icon:
            "text-slate-300",

          iconBox:
            "bg-slate-700 text-slate-200",

          badge:
            "bg-slate-700 text-slate-200",

          preview:
            "from-slate-700/60 via-slate-800 to-slate-900",

          border:
            "border-slate-700 hover:border-slate-500",
        },
      };

    // ==================================================
    // OTHER
    // ==================================================

    default:
      return {
        key: "other",
        label:
          "Other file",
        badge,
        icon:
          File,

        light: {
          icon:
            "text-slate-500",

          iconBox:
            "bg-slate-100 text-slate-500",

          badge:
            "bg-slate-100 text-slate-600",

          preview:
            "from-slate-100 via-slate-50 to-white",

          border:
            "border-slate-200 hover:border-slate-400",
        },

        dark: {
          icon:
            "text-slate-300",

          iconBox:
            "bg-slate-700 text-slate-300",

          badge:
            "bg-slate-700 text-slate-200",

          preview:
            "from-slate-700/60 via-slate-800 to-slate-900",

          border:
            "border-slate-700 hover:border-slate-500",
        },
      };
  }
};

// ======================================================
// DISPLAY NAME
// ======================================================

export const getItemDisplayName = (
  item
) => {
  if (!item?.name) {
    return "Untitled";
  }

  const type =
    getItemTypeKey(
      item,
      "file"
    );

  if (
    type === "document"
  ) {
    return item.name.replace(
      /\.txt$/i,
      ""
    );
  }

  if (
    type ===
    "spreadsheet"
  ) {
    return item.name.replace(
      /\.cloudsheet$/i,
      ""
    );
  }

  if (
    type ===
    "presentation"
  ) {
    return item.name.replace(
      /\.cloudslides$/i,
      ""
    );
  }

  return item.name;
};