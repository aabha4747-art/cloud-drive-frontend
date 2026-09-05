import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  Eraser,
  Italic,
  Plus,
  RefreshCw,
  Save,
  Sheet,
  Underline,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";

const DEFAULT_ROWS = 50;
const DEFAULT_COLUMNS = 26;

// ======================================================
// HELPERS
// ======================================================

function getColumnLabel(index) {
  let value = index + 1;
  let label = "";

  while (value > 0) {
    const remainder =
      (value - 1) % 26;

    label =
      String.fromCharCode(
        65 + remainder
      ) + label;

    value =
      Math.floor(
        (value - 1) / 26
      );
  }

  return label;
}

function getCellKey(
  rowIndex,
  columnIndex
) {
  return `${getColumnLabel(
    columnIndex
  )}${rowIndex + 1}`;
}

function getDisplayName(name) {
  if (!name) {
    return "Untitled spreadsheet";
  }

  return name.replace(
    /\.cloudsheet$/i,
    ""
  );
}

// ======================================================
// CELL HELPERS
// ======================================================

function getCellObject(cell) {
  if (
    cell !== null &&
    typeof cell === "object" &&
    !Array.isArray(cell)
  ) {
    return {
      value:
        cell.value ?? "",
      style:
        cell.style || {},
    };
  }

  return {
    value:
      cell ?? "",
    style: {},
  };
}

function getCellValue(cell) {
  return getCellObject(
    cell
  ).value;
}

function getCellStyle(cell) {
  return getCellObject(
    cell
  ).style;
}

// ======================================================
// CSS STYLE
// ======================================================

function buildCellStyle(
  style = {}
) {
  return {
    backgroundColor:
      style.backgroundColor ||
      undefined,

    color:
      style.color ||
      undefined,

    fontWeight:
      style.fontWeight ||
      undefined,

    fontSize:
      style.fontSize ||
      undefined,

    fontFamily:
      style.fontFamily ||
      undefined,

    textAlign:
      style.textAlign ||
      undefined,

    fontStyle:
      style.fontStyle ||
      undefined,

    textDecoration:
      style.textDecoration ||
      undefined,

    borderColor:
      style.borderColor ||
      undefined,
  };
}

// ======================================================
// PAGE
// ======================================================

function SpreadsheetEditorPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    spreadsheetId,
  } = useParams();

  // ======================================================
  // META
  // ======================================================

  const [
    spreadsheet,
    setSpreadsheet,
  ] = useState(null);

  // ======================================================
  // DATA
  // ======================================================

  const [
    spreadsheetData,
    setSpreadsheetData,
  ] = useState(null);

  const [
    originalData,
    setOriginalData,
  ] = useState(null);

  // ======================================================
  // ACTIVE CELL
  // ======================================================

  const [
    activeCell,
    setActiveCell,
  ] = useState(null);

  // ======================================================
  // STATUS
  // ======================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // ======================================================
  // LOAD
  // ======================================================

  const loadSpreadsheet =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/files/spreadsheets/${spreadsheetId}`
            );

          const loadedSpreadsheet =
            response.data
              ?.spreadsheet;

          if (
            !loadedSpreadsheet
          ) {
            throw new Error(
              "Spreadsheet data was not returned"
            );
          }

          const loadedData =
            loadedSpreadsheet
              .data || {
              version: 1,

              sheets: [
                {
                  id:
                    "sheet-1",

                  name:
                    "Sheet1",

                  rows:
                    DEFAULT_ROWS,

                  columns:
                    DEFAULT_COLUMNS,

                  cells: {},
                },
              ],

              activeSheetId:
                "sheet-1",
            };

          setSpreadsheet(
            loadedSpreadsheet
          );

          setSpreadsheetData(
            loadedData
          );

          setOriginalData(
            JSON.parse(
              JSON.stringify(
                loadedData
              )
            )
          );
        } catch (err) {
          console.error(
            "Load spreadsheet error:",
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
            err.message ||
            "Unable to load spreadsheet."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        spreadsheetId,
        navigate,
      ]
    );

  useEffect(() => {
    loadSpreadsheet();
  }, [loadSpreadsheet]);

  // ======================================================
  // ACTIVE SHEET
  // ======================================================

  const activeSheet =
    useMemo(() => {
      if (
        !spreadsheetData
          ?.sheets?.length
      ) {
        return null;
      }

      return (
        spreadsheetData
          .sheets.find(
            (sheet) =>
              sheet.id ===
              spreadsheetData
                .activeSheetId
          ) ||
        spreadsheetData
          .sheets[0]
      );
    }, [spreadsheetData]);

  // ======================================================
  // ACTIVE CELL OBJECT
  // ======================================================

  const activeCellObject =
    useMemo(() => {
      if (
        !activeCell ||
        !activeSheet
      ) {
        return {
          value: "",
          style: {},
        };
      }

      return getCellObject(
        activeSheet
          .cells?.[
          activeCell
        ]
      );
    }, [
      activeCell,
      activeSheet,
    ]);

  const activeCellValue =
    activeCellObject.value;

  const activeCellStyle =
    activeCellObject.style ||
    {};

  // ======================================================
  // UNSAVED
  // ======================================================

  const hasUnsavedChanges =
    useMemo(() => {
      if (
        !spreadsheetData ||
        !originalData
      ) {
        return false;
      }

      return (
        JSON.stringify(
          spreadsheetData
        ) !==
        JSON.stringify(
          originalData
        )
      );
    }, [
      spreadsheetData,
      originalData,
    ]);

  // ======================================================
  // UPDATE CELL OBJECT
  // ======================================================

  const updateCell =
    (
      cellKey,
      updater
    ) => {
      if (
        !spreadsheet
          ?.canEdit ||
        !activeSheet
      ) {
        return;
      }

      setSpreadsheetData(
        (current) => ({
          ...current,

          sheets:
            current.sheets.map(
              (sheet) => {
                if (
                  sheet.id !==
                  activeSheet.id
                ) {
                  return sheet;
                }

                const oldCell =
                  getCellObject(
                    sheet.cells?.[
                      cellKey
                    ]
                  );

                const updated =
                  updater(
                    oldCell
                  );

                return {
                  ...sheet,

                  cells: {
                    ...sheet.cells,

                    [cellKey]:
                      updated,
                  },
                };
              }
            ),
        })
      );
    };

  // ======================================================
  // VALUE CHANGE
  // ======================================================

  const handleCellChange = (
    rowIndex,
    columnIndex,
    value
  ) => {
    const key =
      getCellKey(
        rowIndex,
        columnIndex
      );

    updateCell(
      key,
      (cell) => ({
        ...cell,
        value,
      })
    );
  };

  // ======================================================
  // FORMULA BAR
  // ======================================================

  const handleFormulaChange = (
    value
  ) => {
    if (!activeCell) {
      return;
    }

    updateCell(
      activeCell,
      (cell) => ({
        ...cell,
        value,
      })
    );
  };

  // ======================================================
  // UPDATE STYLE
  // ======================================================

  const updateActiveCellStyle =
    (
      styleChanges
    ) => {
      if (!activeCell) {
        return;
      }

      updateCell(
        activeCell,
        (cell) => ({
          ...cell,

          style: {
            ...cell.style,
            ...styleChanges,
          },
        })
      );
    };

  // ======================================================
  // BOLD
  // ======================================================

  const handleBold = () => {
    updateActiveCellStyle({
      fontWeight:
        activeCellStyle
          .fontWeight ===
        "700"
          ? "400"
          : "700",
    });
  };

  // ======================================================
  // ITALIC
  // ======================================================

  const handleItalic = () => {
    updateActiveCellStyle({
      fontStyle:
        activeCellStyle
          .fontStyle ===
        "italic"
          ? "normal"
          : "italic",
    });
  };

  // ======================================================
  // UNDERLINE
  // ======================================================

  const handleUnderline =
    () => {
      updateActiveCellStyle({
        textDecoration:
          activeCellStyle
            .textDecoration ===
          "underline"
            ? "none"
            : "underline",
      });
    };

  // ======================================================
  // CLEAR FORMATTING
  // ======================================================

  const handleClearFormatting =
    () => {
      if (!activeCell) {
        return;
      }

      updateCell(
        activeCell,
        (cell) => ({
          value:
            cell.value,

          style: {},
        })
      );
    };

  // ======================================================
  // SAVE
  // ======================================================

  const handleSave =
    async () => {
      if (
        !spreadsheet
          ?.canEdit ||
        !spreadsheetData
      ) {
        return;
      }

      try {
        setSaving(true);

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/files/spreadsheets/${spreadsheetId}/content`,
            {
              data:
                spreadsheetData,
            }
          );

        const updatedSpreadsheet =
          response.data
            ?.spreadsheet;

        setOriginalData(
          JSON.parse(
            JSON.stringify(
              spreadsheetData
            )
          )
        );

        if (
          updatedSpreadsheet
        ) {
          setSpreadsheet(
            (current) => ({
              ...current,
              ...updatedSpreadsheet,
            })
          );
        }

        window.dispatchEvent(
  new Event(
    "cloud-drive-storage-changed"
  )
);

        setSuccess(
          "Spreadsheet saved successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 2000);
      } catch (err) {
        console.error(
          "Save spreadsheet error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
          err.response?.data
            ?.message ||
          "Unable to save spreadsheet."
        );
      } finally {
        setSaving(false);
      }
    };

  // ======================================================
  // CTRL + S
  // ======================================================

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      const isSaveShortcut =
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      if (
        spreadsheet?.canEdit &&
        !saving
      ) {
        handleSave();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    spreadsheet?.canEdit,
    saving,
    spreadsheetData,
  ]);

  // ======================================================
  // ADD SHEET
  // ======================================================

  const handleAddSheet =
    () => {
      if (
        !spreadsheet
          ?.canEdit
      ) {
        return;
      }

      setSpreadsheetData(
        (current) => {
          const nextIndex =
            current
              .sheets.length +
            1;

          const newSheet = {
            id:
              `sheet-${Date.now()}`,

            name:
              `Sheet${nextIndex}`,

            rows:
              DEFAULT_ROWS,

            columns:
              DEFAULT_COLUMNS,

            cells: {},
          };

          return {
            ...current,

            sheets: [
              ...current.sheets,
              newSheet,
            ],

            activeSheetId:
              newSheet.id,
          };
        }
      );

      setActiveCell(
        null
      );
    };

  // ======================================================
  // CHANGE SHEET
  // ======================================================

  const handleSelectSheet = (
    sheetId
  ) => {
    setSpreadsheetData(
      (current) => ({
        ...current,

        activeSheetId:
          sheetId,
      })
    );

    setActiveCell(
      null
    );
  };

  // ======================================================
  // BACK
  // ======================================================

  const handleBack = () => {
    const returnTo =
      location.state
        ?.returnTo;

    if (returnTo) {
      navigate(
        returnTo,
        {
          state:
            location.state
              ?.returnState ||
            {},
        }
      );

      return;
    }

    navigate(
      "/dashboard"
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC]">

        <div className="text-center">

          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-emerald-500"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading spreadsheet...
          </p>

        </div>

      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (
    error &&
    !spreadsheet
  ) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] px-6 py-10">

        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={
              handleBack
            }
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft
              size={18}
            />

            Back
          </button>

          <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center">

            <p className="font-semibold text-red-600">
              {error}
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
    <div className="flex min-h-screen flex-col bg-[#F6F8FC]">

      {/* ==================================================
          TOP HEADER
      ================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">

        <div className="flex min-h-[74px] items-center justify-between gap-4 px-5 lg:px-7">

          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={
                handleBack
              }
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
            >
              <ArrowLeft
                size={21}
              />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <Sheet
                size={23}
              />

            </div>

            <div className="min-w-0">

              <h1 className="truncate text-lg font-bold text-slate-900">
                {getDisplayName(
                  spreadsheet?.name
                )}
              </h1>

              <div className="mt-1 flex items-center gap-2">

                {spreadsheet
                  ?.canEdit ? (
                  hasUnsavedChanges ? (
                    <span className="text-xs font-medium text-amber-500">
                      Unsaved changes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">

                      <Check
                        size={13}
                      />

                      Saved

                    </span>
                  )
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    View only
                  </span>
                )}

              </div>

            </div>

          </div>

          {spreadsheet
            ?.canEdit && (
            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                saving ||
                !hasUnsavedChanges
              }
              className="flex min-w-[105px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save
                    size={16}
                  />

                  Save
                </>
              )}

            </button>
          )}

        </div>

      </header>

      {/* ==================================================
          STATUS
      ================================================== */}

      {success && (
        <div className="mx-5 mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* ==================================================
          FORMATTING TOOLBAR
      ================================================== */}

      <div className="border-b border-slate-200 bg-white px-4 py-2">

        <div className="flex flex-wrap items-center gap-2">

          {/* CELL NAME */}

          <div className="min-w-[80px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-600">

            {activeCell ||
              activeSheet?.name ||
              "Sheet"}

          </div>

          <div className="h-7 w-px bg-slate-200" />

          {/* FONT FAMILY */}

          <select
            value={
              activeCellStyle
                .fontFamily ||
              "Arial"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onChange={(e) =>
              updateActiveCellStyle({
                fontFamily:
                  e.target
                    .value,
              })
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none disabled:opacity-50"
          >

            <option value="Arial">
              Arial
            </option>

            <option value="Inter">
              Inter
            </option>

            <option value="Georgia">
              Georgia
            </option>

            <option value="Times New Roman">
              Times New Roman
            </option>

            <option value="Courier New">
              Courier New
            </option>

          </select>

          {/* FONT SIZE */}

          <select
            value={
              activeCellStyle
                .fontSize ||
              "14px"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onChange={(e) =>
              updateActiveCellStyle({
                fontSize:
                  e.target
                    .value,
              })
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none disabled:opacity-50"
          >

            {[
              10,
              11,
              12,
              14,
              16,
              18,
              20,
              24,
              28,
              32,
            ].map(
              (size) => (
                <option
                  key={
                    size
                  }
                  value={`${size}px`}
                >
                  {size}
                </option>
              )
            )}

          </select>

          <div className="h-7 w-px bg-slate-200" />

          {/* BOLD */}

          <ToolbarButton
            title="Bold"
            active={
              activeCellStyle
                .fontWeight ===
              "700"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={
              handleBold
            }
          >
            <Bold
              size={16}
            />
          </ToolbarButton>

          {/* ITALIC */}

          <ToolbarButton
            title="Italic"
            active={
              activeCellStyle
                .fontStyle ===
              "italic"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={
              handleItalic
            }
          >
            <Italic
              size={16}
            />
          </ToolbarButton>

          {/* UNDERLINE */}

          <ToolbarButton
            title="Underline"
            active={
              activeCellStyle
                .textDecoration ===
              "underline"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={
              handleUnderline
            }
          >
            <Underline
              size={16}
            />
          </ToolbarButton>

          <div className="h-7 w-px bg-slate-200" />

          {/* TEXT COLOR */}

          <label
            className={`
              flex
              h-9
              cursor-pointer
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              bg-white
              px-2.5
              text-xs
              font-semibold
              text-slate-600

              ${
                !activeCell
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            `}
            title="Text color"
          >

            <span className="font-bold">
              A
            </span>

            <span
              className="h-1.5 w-5 rounded-full"
              style={{
                backgroundColor:
                  activeCellStyle
                    .color ||
                  "#0f172a",
              }}
            />

            <input
              type="color"
              value={
                activeCellStyle
                  .color ||
                "#0f172a"
              }
              onChange={(e) =>
                updateActiveCellStyle({
                  color:
                    e.target
                      .value,
                })
              }
              className="h-0 w-0 opacity-0"
            />

          </label>

          {/* FILL COLOR */}

          <label
            className={`
              flex
              h-9
              cursor-pointer
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              bg-white
              px-2.5
              text-xs
              font-semibold
              text-slate-600

              ${
                !activeCell
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            `}
            title="Fill color"
          >

            <span>
              Fill
            </span>

            <span
              className="h-4 w-4 rounded border border-slate-200"
              style={{
                backgroundColor:
                  activeCellStyle
                    .backgroundColor ||
                  "#ffffff",
              }}
            />

            <input
              type="color"
              value={
                activeCellStyle
                  .backgroundColor ||
                "#ffffff"
              }
              onChange={(e) =>
                updateActiveCellStyle({
                  backgroundColor:
                    e.target
                      .value,
                })
              }
              className="h-0 w-0 opacity-0"
            />

          </label>

          <div className="h-7 w-px bg-slate-200" />

          {/* ALIGN LEFT */}

          <ToolbarButton
            title="Align left"
            active={
              activeCellStyle
                .textAlign ===
                "left" ||
              !activeCellStyle
                .textAlign
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={() =>
              updateActiveCellStyle({
                textAlign:
                  "left",
              })
            }
          >
            <AlignLeft
              size={16}
            />
          </ToolbarButton>

          {/* ALIGN CENTER */}

          <ToolbarButton
            title="Align center"
            active={
              activeCellStyle
                .textAlign ===
              "center"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={() =>
              updateActiveCellStyle({
                textAlign:
                  "center",
              })
            }
          >
            <AlignCenter
              size={16}
            />
          </ToolbarButton>

          {/* ALIGN RIGHT */}

          <ToolbarButton
            title="Align right"
            active={
              activeCellStyle
                .textAlign ===
              "right"
            }
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={() =>
              updateActiveCellStyle({
                textAlign:
                  "right",
              })
            }
          >
            <AlignRight
              size={16}
            />
          </ToolbarButton>

          <div className="h-7 w-px bg-slate-200" />

          {/* CLEAR FORMATTING */}

          <ToolbarButton
            title="Clear formatting"
            disabled={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            onClick={
              handleClearFormatting
            }
          >
            <Eraser
              size={16}
            />
          </ToolbarButton>

        </div>

      </div>

      {/* ==================================================
          FORMULA BAR
      ================================================== */}

      <div className="border-b border-slate-200 bg-white px-4 py-2">

        <div className="flex items-center gap-3">

          <span className="text-xs font-bold text-slate-400">
            fx
          </span>

          <input
            value={
              activeCellValue
            }
            onChange={(event) =>
              handleFormulaChange(
                event.target
                  .value
              )
            }
            readOnly={
              !activeCell ||
              !spreadsheet
                ?.canEdit
            }
            placeholder={
              activeCell
                ? "Edit cell value"
                : "Click any cell to start editing"
            }
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />

        </div>

      </div>

      {/* ==================================================
          GRID
      ================================================== */}

      <main className="min-h-0 flex-1 overflow-auto bg-white">

        {activeSheet && (
          <div className="min-w-max">

            <table className="border-collapse text-sm">

              <thead>

                <tr>

                  <th className="sticky left-0 top-0 z-30 h-9 w-12 min-w-12 border border-slate-200 bg-slate-100" />

                  {Array.from({
                    length:
                      activeSheet.columns ||
                      DEFAULT_COLUMNS,
                  }).map(
                    (
                      _,
                      columnIndex
                    ) => (
                      <th
                        key={
                          columnIndex
                        }
                        className="sticky top-0 z-20 h-9 min-w-[120px] border border-slate-200 bg-slate-100 px-2 text-center text-xs font-semibold text-slate-500"
                      >
                        {getColumnLabel(
                          columnIndex
                        )}
                      </th>
                    )
                  )}

                </tr>

              </thead>

              <tbody>

                {Array.from({
                  length:
                    activeSheet.rows ||
                    DEFAULT_ROWS,
                }).map(
                  (
                    _,
                    rowIndex
                  ) => (
                    <tr
                      key={
                        rowIndex
                      }
                    >

                      <th className="sticky left-0 z-10 h-10 w-12 min-w-12 border border-slate-200 bg-slate-100 text-center text-xs font-semibold text-slate-500">
                        {rowIndex +
                          1}
                      </th>

                      {Array.from({
                        length:
                          activeSheet.columns ||
                          DEFAULT_COLUMNS,
                      }).map(
                        (
                          _,
                          columnIndex
                        ) => {
                          const key =
                            getCellKey(
                              rowIndex,
                              columnIndex
                            );

                          const rawCell =
                            activeSheet
                              .cells?.[
                              key
                            ];

                          const cellValue =
                            getCellValue(
                              rawCell
                            );

                          const cellStyle =
                            getCellStyle(
                              rawCell
                            );

                          const selected =
                            activeCell ===
                            key;

                          return (
                            <td
                              key={
                                key
                              }
                              style={{
                                backgroundColor:
                                  cellStyle
                                    .backgroundColor ||
                                  undefined,

                                borderColor:
                                  cellStyle
                                    .borderColor ||
                                  undefined,
                              }}
                              className={`
                                relative
                                h-10
                                min-w-[120px]
                                border
                                border-slate-200
                                p-0

                                ${
                                  selected
                                    ? "z-[5]"
                                    : ""
                                }
                              `}
                            >

                              <input
                                value={
                                  cellValue
                                }
                                onFocus={() =>
                                  setActiveCell(
                                    key
                                  )
                                }
                                onClick={() =>
                                  setActiveCell(
                                    key
                                  )
                                }
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    columnIndex,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                readOnly={
                                  !spreadsheet
                                    ?.canEdit
                                }
                                style={
                                  buildCellStyle(
                                    cellStyle
                                  )
                                }
                                className={`
                                  h-10
                                  w-full
                                  min-w-[120px]
                                  border-0
                                  bg-transparent
                                  px-3
                                  text-sm
                                  outline-none
                                  transition

                                  ${
                                    !cellStyle
                                      .color
                                      ? "text-slate-800"
                                      : ""
                                  }

                                  ${
                                    selected
                                      ? "ring-2 ring-inset ring-emerald-500"
                                      : ""
                                  }
                                `}
                              />

                            </td>
                          );
                        }
                      )}

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </main>

      {/* ==================================================
          SHEET TABS
      ================================================== */}

      <footer className="sticky bottom-0 z-40 border-t border-slate-200 bg-white">

        <div className="flex min-h-[54px] items-center gap-2 overflow-x-auto px-4">

          {spreadsheetData
            ?.sheets?.map(
              (sheet) => {
                const active =
                  sheet.id ===
                  spreadsheetData
                    .activeSheetId;

                return (
                  <button
                    key={
                      sheet.id
                    }
                    type="button"
                    onClick={() =>
                      handleSelectSheet(
                        sheet.id
                      )
                    }
                    className={`
                      shrink-0
                      rounded-lg
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      transition

                      ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-100"
                      }
                    `}
                  >
                    {
                      sheet.name
                    }
                  </button>
                );
              }
            )}

          {spreadsheet
            ?.canEdit && (
              <button
                type="button"
                onClick={
                  handleAddSheet
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                title="Add sheet"
              >
                <Plus
                  size={18}
                />
              </button>
            )}

          <div className="ml-auto shrink-0 pr-2 text-xs text-slate-400">
            {spreadsheet
              ?.canEdit
              ? "Ctrl + S to save"
              : "Read only"}
          </div>

        </div>

      </footer>

    </div>
  );
}

// ======================================================
// TOOLBAR BUTTON
// ======================================================

function ToolbarButton({
  children,
  title,
  active = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        border
        transition

        ${
          active
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }

        disabled:cursor-not-allowed
        disabled:opacity-40
      `}
    >
      {children}
    </button>
  );
}

export default SpreadsheetEditorPage;