import { Braces, FileArchive, FileCode2, FileText, Presentation, Sheet, Table2 } from "lucide-react";

function getExtension(name = "") {
  const clean = String(name).trim();
  const dot = clean.lastIndexOf(".");
  if (dot <= 0 || dot === clean.length - 1) return "";
  return clean.slice(dot + 1).toUpperCase();
}

const CARD_STYLES = {
  word: {
    shell: "from-blue-50 via-white to-blue-100",
    accent: "bg-blue-600",
    text: "text-blue-700",
    badge: "bg-blue-600 text-white",
    icon: FileText,
    label: "DOC",
  },
  excel: {
    shell: "from-emerald-50 via-white to-green-100",
    accent: "bg-emerald-600",
    text: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
    icon: Table2,
    label: "XLS",
  },
  powerpoint: {
    shell: "from-orange-50 via-white to-amber-100",
    accent: "bg-orange-600",
    text: "text-orange-700",
    badge: "bg-orange-600 text-white",
    icon: Presentation,
    label: "PPT",
  },
  document: {
    shell: "from-indigo-50 via-white to-violet-100",
    accent: "bg-indigo-600",
    text: "text-indigo-700",
    badge: "bg-indigo-600 text-white",
    icon: FileText,
    label: "DOC",
  },
  spreadsheet: {
    shell: "from-emerald-50 via-white to-teal-100",
    accent: "bg-emerald-600",
    text: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
    icon: Sheet,
    label: "SHEET",
  },
  presentation: {
    shell: "from-orange-50 via-white to-rose-100",
    accent: "bg-orange-600",
    text: "text-orange-700",
    badge: "bg-orange-600 text-white",
    icon: Presentation,
    label: "SLIDE",
  },
  text: {
    shell: "from-sky-50 via-white to-cyan-100",
    accent: "bg-sky-500",
    text: "text-sky-700",
    badge: "bg-sky-500 text-white",
    icon: FileText,
    label: "TXT",
  },
  code: {
    shell: "from-slate-100 via-white to-slate-200",
    accent: "bg-slate-700",
    text: "text-slate-700",
    badge: "bg-slate-700 text-white",
    icon: FileCode2,
    label: "CODE",
  },
  archive: {
    shell: "from-yellow-50 via-white to-amber-100",
    accent: "bg-yellow-500",
    text: "text-yellow-700",
    badge: "bg-yellow-500 text-white",
    icon: FileArchive,
    label: "ZIP",
  },
};

function DocumentMock({ accent }) {
  return (
    <div className="relative h-[72px] w-[56px] rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className={`mb-2 h-2 w-5 rounded ${accent}`} />
      <div className="space-y-1">
        <div className="h-1.5 rounded bg-slate-200" />
        <div className="h-1.5 w-10/12 rounded bg-slate-200" />
        <div className="h-1.5 w-8/12 rounded bg-slate-200" />
        <div className="h-1.5 w-11/12 rounded bg-slate-200" />
        <div className="h-1.5 w-7/12 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function SpreadsheetMock({ accent }) {
  return (
    <div className="h-[70px] w-[72px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className={`h-2.5 w-full ${accent}`} />
      <div className="grid h-[57px] grid-cols-4 grid-rows-4">
        {Array.from({ length: 16 }).map((_, index) => (
          <div
            key={index}
            className={`border-b border-r border-slate-200 ${
              index === 5 || index === 10 ? "bg-emerald-50" : "bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PresentationMock({ accent }) {
  return (
    <div className="relative h-[62px] w-[86px] overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-2 ${accent}`} />
      <div className="mt-2 h-2 w-9 rounded bg-slate-300" />
      <div className="mt-2 flex gap-2">
        <div className={`h-8 w-8 rounded ${accent} opacity-20`} />
        <div className="flex-1 space-y-1 pt-1">
          <div className="h-1.5 rounded bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded bg-slate-200" />
          <div className="h-1.5 w-3/5 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function CodeMock() {
  return (
    <div className="h-[70px] w-[86px] rounded-md border border-slate-300 bg-slate-900 p-2 shadow-sm">
      <div className="mb-1.5 flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
      </div>
      <div className="space-y-1">
        <div className="h-1.5 w-4/5 rounded bg-slate-500" />
        <div className="h-1.5 w-3/5 rounded bg-slate-600" />
        <div className="h-1.5 w-11/12 rounded bg-slate-500" />
        <div className="h-1.5 w-2/3 rounded bg-slate-600" />
      </div>
    </div>
  );
}

function OfficeFilePreviewCard({ file, typeKey, isDark = false }) {
  const style = CARD_STYLES[typeKey];
  if (!style) return null;

  const extension = getExtension(file?.name) || style.label;
  const Icon = style.icon;

  let mock = <DocumentMock accent={style.accent} />;

  if (typeKey === "excel" || typeKey === "spreadsheet") {
    mock = <SpreadsheetMock accent={style.accent} />;
  } else if (typeKey === "powerpoint" || typeKey === "presentation") {
    mock = <PresentationMock accent={style.accent} />;
  } else if (typeKey === "code") {
    mock = <CodeMock />;
  } else if (typeKey === "archive") {
    mock = (
      <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-white shadow-sm">
        <FileArchive size={34} className={style.text} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${style.shell} ${
        isDark ? "brightness-[0.82]" : ""
      }`}
    >
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ${style.text}`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="absolute right-2 top-2">
        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${style.badge}`}>
          {extension.slice(0, 5)}
        </span>
      </div>

      {mock}
    </div>
  );
}

export default OfficeFilePreviewCard;
