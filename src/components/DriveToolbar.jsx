import {
  Check,
  ChevronDown,
  Grid2X2,
  List,
  Search,
  X,
} from "lucide-react";

function DriveToolbar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  typeFilter = "all",
  onTypeFilterChange,
  typeOptions = [],
  viewMode = "grid",
  onViewModeChange,
  isDark = false,
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-3 shadow-sm transition-colors lg:flex-row lg:items-center ${
        isDark
          ? "border-slate-800 bg-slate-900"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* SEARCH */}

      <div className="relative min-w-0 flex-1">
        <Search
          size={19}
          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        />

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
          className={`h-12 w-full rounded-xl border pl-11 pr-11 text-sm outline-none transition ${
            isDark
              ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          }`}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition ${
              isDark
                ? "text-slate-500 hover:bg-slate-800 hover:text-white"
                : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            }`}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* TYPE DROPDOWN */}

      {typeOptions.length > 0 && (
        <div className="relative shrink-0">
          <select
            value={typeFilter}
            onChange={(event) =>
              onTypeFilterChange?.(event.target.value)
            }
            className={`h-12 min-w-[180px] cursor-pointer appearance-none rounded-xl border px-4 pr-10 text-sm font-semibold outline-none transition ${
              isDark
                ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-600 focus:border-violet-500"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 focus:border-violet-400"
            }`}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={17}
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          />
        </div>
      )}

      {/* LIST / GRID */}

      <div
        className={`flex h-12 shrink-0 overflow-hidden rounded-xl border ${
          isDark
            ? "border-slate-700 bg-slate-950"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <button
          type="button"
          onClick={() => onViewModeChange?.("list")}
          className={`flex min-w-[58px] items-center justify-center gap-1.5 px-3 transition ${
            viewMode === "list"
              ? isDark
                ? "bg-violet-500/20 text-violet-300"
                : "bg-violet-100 text-violet-700"
              : isDark
                ? "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          }`}
          title="List view"
        >
          {viewMode === "list" && <Check size={14} />}
          <List size={20} />
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange?.("grid")}
          className={`flex min-w-[58px] items-center justify-center gap-1.5 border-l px-3 transition ${
            isDark ? "border-slate-700" : "border-slate-200"
          } ${
            viewMode === "grid"
              ? isDark
                ? "bg-violet-500/20 text-violet-300"
                : "bg-violet-100 text-violet-700"
              : isDark
                ? "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          }`}
          title="Grid view"
        >
          {viewMode === "grid" && <Check size={14} />}
          <Grid2X2 size={19} />
        </button>
      </div>
    </div>
  );
}

export default DriveToolbar;