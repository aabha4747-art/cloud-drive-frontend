import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare2,
  DollarSign,
  FileUp,
  LayoutTemplate,
  Presentation,
  Sheet,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import {
  useRef,
} from "react";

// ======================================================
// TEMPLATE DATA
// ======================================================

const spreadsheetTemplates = [
  {
    id: "project-tracker",
    name: "Project Tracker",
    description:
      "Track tasks, owners, priorities, status, and deadlines.",
    icon: CheckSquare2,
    accent:
      "emerald",
    previewType:
      "project-tracker",
  },
  {
    id: "monthly-budget",
    name: "Monthly Budget",
    description:
      "Organize income, expenses, categories, and savings.",
    icon: DollarSign,
    accent:
      "green",
    previewType:
      "monthly-budget",
  },
  {
    id: "task-list",
    name: "Task List",
    description:
      "Manage tasks, priorities, due dates, and completion.",
    icon: CheckSquare2,
    accent:
      "blue",
    previewType:
      "task-list",
  },
  {
    id: "weekly-planner",
    name: "Weekly Planner",
    description:
      "Plan activities and priorities across your week.",
    icon: CalendarDays,
    accent:
      "violet",
    previewType:
      "weekly-planner",
  },
];

const presentationTemplates = [
  {
    id: "pitch-deck",
    name: "Pitch Deck",
    description:
      "Problem, solution, market, product, traction, and business model.",
    icon: BriefcaseBusiness,
    accent:
      "orange",
    previewType:
      "pitch-deck",
  },
  {
    id: "project-update",
    name: "Project Update",
    description:
      "Progress, milestones, metrics, blockers, and next steps.",
    icon: BarChart3,
    accent:
      "indigo",
    previewType:
      "project-update",
  },
  {
    id: "research-presentation",
    name: "Research Presentation",
    description:
      "Objectives, methodology, results, discussion, and conclusions.",
    icon: Presentation,
    accent:
      "sky",
    previewType:
      "research-presentation",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description:
      "Showcase projects, achievements, skills, and experience.",
    icon: Sparkles,
    accent:
      "rose",
    previewType:
      "portfolio",
  },
];

// ======================================================
// TEMPLATE GALLERY
// ======================================================

function TemplateGalleryModal({
  type,
  onClose,
  onSelectTemplate,
  onImportTemplate,
}) {
  const fileInputRef =
    useRef(null);

  const isSpreadsheet =
    type === "spreadsheet";

  const templates =
    isSpreadsheet
      ? spreadsheetTemplates
      : presentationTemplates;

  const TypeIcon =
    isSpreadsheet
      ? Sheet
      : Presentation;

  const title =
    isSpreadsheet
      ? "Spreadsheet templates"
      : "Presentation templates";

  const description =
    isSpreadsheet
      ? "Choose a ready-made spreadsheet or import your own template."
      : "Choose a ready-made presentation or import your own template.";

  const acceptedTypes =
    isSpreadsheet
      ? ".xlsx,.xls,.csv"
      : ".pptx,.ppt";

  // ======================================================
  // IMPORT FILE
  // ======================================================

  const handleImportChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      onImportTemplate
    ) {
      onImportTemplate(
        file
      );
    }

    event.target.value =
      "";
  };

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">

      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">

          <div className="flex items-start gap-4">

            <div
              className={`
                flex
                h-13
                w-13
                shrink-0
                items-center
                justify-center
                rounded-2xl

                ${
                  isSpreadsheet
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }
              `}
            >

              <LayoutTemplate
                size={25}
              />

            </div>

            <div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {description}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X
              size={20}
            />
          </button>

        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="overflow-y-auto p-7">

          {/* ==================================================
              TOP LABEL
          ================================================== */}

          <div className="mb-5 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <TypeIcon
                size={18}
                className={
                  isSpreadsheet
                    ? "text-emerald-600"
                    : "text-amber-600"
                }
              />

              <h3 className="text-sm font-bold text-slate-700">
                Choose how you want to start
              </h3>

            </div>

            <span className="text-xs text-slate-400">
              {
                templates.length
              } ready-made templates
            </span>

          </div>

          {/* ==================================================
              TEMPLATE GRID
          ================================================== */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* ==================================================
                IMPORT TEMPLATE CARD
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                fileInputRef.current
                  ?.click()
              }
              className="
                group
                flex
                min-h-[330px]
                flex-col
                overflow-hidden
                rounded-3xl
                border-2
                border-dashed
                border-slate-200
                bg-slate-50/70
                text-left
                transition
                duration-200

                hover:-translate-y-1
                hover:border-indigo-300
                hover:bg-indigo-50/40
                hover:shadow-lg
              "
            >

              <div className="flex flex-1 items-center justify-center p-8">

                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm transition group-hover:scale-105">

                    <FileUp
                      size={28}
                    />

                  </div>

                  <h4 className="mt-5 text-base font-bold text-slate-800">
                    Import your template
                  </h4>

                  <p className="mx-auto mt-2 max-w-[220px] text-xs leading-5 text-slate-500">
                    Upload an existing{" "}
                    {isSpreadsheet
                      ? "Excel or CSV"
                      : "PowerPoint"}{" "}
                    file and use it as a starting point.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-600 shadow-sm">

                    <Upload
                      size={14}
                    />

                    Choose file

                  </div>

                  <p className="mt-3 text-[11px] text-slate-400">
                    {isSpreadsheet
                      ? ".xlsx, .xls, .csv"
                      : ".pptx, .ppt"}
                  </p>

                </div>

              </div>

            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept={
                acceptedTypes
              }
              onChange={
                handleImportChange
              }
              className="hidden"
            />

            {/* ==================================================
                BUILT-IN TEMPLATES
            ================================================== */}

            {templates.map(
              (template) => {
                const Icon =
                  template.icon;

                return (
                  <button
                    key={
                      template.id
                    }
                    type="button"
                    onClick={() =>
                      onSelectTemplate(
                        template
                      )
                    }
                    className="
                      group
                      overflow-hidden
                      rounded-3xl
                      border
                      border-slate-200
                      bg-white
                      text-left
                      shadow-sm
                      transition
                      duration-200

                      hover:-translate-y-1
                      hover:border-indigo-200
                      hover:shadow-xl
                    "
                  >

                    {/* ==================================================
                        REALISTIC PREVIEW
                    ================================================== */}

                    <div className="h-[190px] overflow-hidden bg-slate-100 p-4">

                      {isSpreadsheet ? (
                        <SpreadsheetPreview
                          template={
                            template
                          }
                        />
                      ) : (
                        <PresentationPreview
                          template={
                            template
                          }
                        />
                      )}

                    </div>

                    {/* ==================================================
                        DETAILS
                    ================================================== */}

                    <div className="p-5">

                      <div className="flex items-start gap-3">

                        <div
                          className={`
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            ${getAccentClass(
                              template.accent
                            )}
                          `}
                        >

                          <Icon
                            size={19}
                          />

                        </div>

                        <div className="min-w-0 flex-1">

                          <h4 className="font-bold text-slate-800 transition group-hover:text-indigo-600">
                            {
                              template.name
                            }
                          </h4>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {
                              template.description
                            }
                          </p>

                        </div>

                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-xs font-medium text-slate-400">
                          Ready to customize
                        </span>

                        <span
                          className={`
                            text-xs
                            font-bold

                            ${
                              isSpreadsheet
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }
                          `}
                        >
                          Use template →
                        </span>

                      </div>

                    </div>

                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-7 py-4">

          <p className="text-xs text-slate-400">
            You can edit imported and built-in templates after creation.
          </p>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// SPREADSHEET PREVIEW
// ======================================================

function SpreadsheetPreview({
  template,
}) {
  if (
    template.previewType ===
    "project-tracker"
  ) {
    return (
      <div className="h-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

        <div className="mb-2 flex items-center justify-between">

          <div className="h-2.5 w-24 rounded bg-emerald-500/70" />

          <div className="h-2.5 w-10 rounded bg-slate-200" />

        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">

          <div className="grid grid-cols-4 bg-emerald-50">

            {[
              "Task",
              "Owner",
              "Status",
              "Due",
            ].map(
              (item) => (
                <div
                  key={
                    item
                  }
                  className="border-r border-slate-200 px-2 py-1.5 text-[7px] font-bold text-slate-600 last:border-r-0"
                >
                  {item}
                </div>
              )
            )}

          </div>

          {[
            ["Research", "Aabha", "Done", "12 Aug"],
            ["Design", "Priya", "Doing", "15 Aug"],
            ["Testing", "Team", "Todo", "18 Aug"],
            ["Launch", "Team", "Todo", "22 Aug"],
          ].map(
            (
              row,
              rowIndex
            ) => (
              <div
                key={
                  rowIndex
                }
                className="grid grid-cols-4 border-t border-slate-100"
              >
                {row.map(
                  (
                    cell,
                    cellIndex
                  ) => (
                    <div
                      key={
                        cellIndex
                      }
                      className="truncate border-r border-slate-100 px-2 py-1.5 text-[7px] text-slate-500 last:border-r-0"
                    >
                      {cell}
                    </div>
                  )
                )}
              </div>
            )
          )}

        </div>

        <div className="mt-3">

          <div className="mb-1 flex justify-between">

            <span className="text-[7px] text-slate-400">
              Progress
            </span>

            <span className="text-[7px] font-bold text-emerald-600">
              62%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">

            <div className="h-full w-[62%] rounded-full bg-emerald-500" />

          </div>

        </div>

      </div>
    );
  }

  if (
    template.previewType ===
    "monthly-budget"
  ) {
    return (
      <div className="h-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

        <div className="flex gap-2">

          <div className="flex-1 rounded-lg bg-emerald-50 p-2">

            <p className="text-[6px] text-slate-400">
              Income
            </p>

            <p className="mt-1 text-[10px] font-bold text-emerald-600">
              ₹85,000
            </p>

          </div>

          <div className="flex-1 rounded-lg bg-red-50 p-2">

            <p className="text-[6px] text-slate-400">
              Expenses
            </p>

            <p className="mt-1 text-[10px] font-bold text-red-500">
              ₹52,400
            </p>

          </div>

        </div>

        <div className="mt-3 space-y-2">

          {[
            ["Rent", "₹18,000", "w-[78%]"],
            ["Food", "₹9,500", "w-[45%]"],
            ["Travel", "₹6,200", "w-[31%]"],
            ["Other", "₹4,800", "w-[22%]"],
          ].map(
            (
              row
            ) => (
              <div
                key={
                  row[0]
                }
              >
                <div className="mb-1 flex justify-between text-[7px]">

                  <span className="text-slate-500">
                    {row[0]}
                  </span>

                  <span className="font-semibold text-slate-600">
                    {row[1]}
                  </span>

                </div>

                <div className="h-1.5 rounded-full bg-slate-100">

                  <div
                    className={`h-full rounded-full bg-emerald-400 ${row[2]}`}
                  />

                </div>

              </div>
            )
          )}

        </div>

      </div>
    );
  }

  if (
    template.previewType ===
    "task-list"
  ) {
    return (
      <div className="h-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <p className="text-[10px] font-bold text-slate-700">
              Tasks
            </p>

            <p className="text-[6px] text-slate-400">
              Today
            </p>

          </div>

          <div className="rounded-full bg-blue-50 px-2 py-1 text-[6px] font-bold text-blue-600">
            4 remaining
          </div>

        </div>

        <div className="space-y-2">

          {[
            ["Prepare report", true],
            ["Review design", false],
            ["Client call", false],
            ["Update dashboard", false],
          ].map(
            (
              task
            ) => (
              <div
                key={
                  task[0]
                }
                className="flex items-center gap-2 rounded-lg border border-slate-100 p-2"
              >

                <div
                  className={`h-3 w-3 rounded border ${
                    task[1]
                      ? "border-blue-500 bg-blue-500"
                      : "border-slate-300"
                  }`}
                />

                <span
                  className={`text-[7px] ${
                    task[1]
                      ? "text-slate-400 line-through"
                      : "text-slate-600"
                  }`}
                >
                  {task[0]}
                </span>

              </div>
            )
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

      <div className="grid h-full grid-cols-5 gap-1">

        {[
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
        ].map(
          (
            day,
            index
          ) => (
            <div
              key={
                day
              }
              className="rounded-lg bg-violet-50 p-1"
            >

              <p className="text-center text-[6px] font-bold text-violet-600">
                {day}
              </p>

              <div className="mt-2 space-y-1">

                <div className="h-5 rounded bg-white" />

                {index %
                  2 ===
                  0 && (
                  <div className="h-8 rounded bg-violet-100" />
                )}

                <div className="h-4 rounded bg-white" />

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}

// ======================================================
// PRESENTATION PREVIEW
// ======================================================

function PresentationPreview({
  template,
}) {
  if (
    template.previewType ===
    "pitch-deck"
  ) {
    return (
      <div className="flex h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="w-2/5 bg-slate-950 p-4">

          <div className="mt-3 h-2 w-10 rounded bg-orange-400" />

          <p className="mt-5 text-[11px] font-bold leading-tight text-white">
            Build the future
          </p>

          <p className="mt-2 text-[6px] leading-3 text-slate-400">
            A better way to solve a real problem.
          </p>

          <div className="mt-5 rounded bg-orange-500 px-2 py-1 text-center text-[6px] font-bold text-white">
            Pitch Deck
          </div>

        </div>

        <div className="flex flex-1 items-center justify-center bg-orange-50">

          <div className="relative h-20 w-20">

            <div className="absolute left-1 top-5 h-12 w-12 rounded-2xl bg-orange-200" />

            <div className="absolute bottom-2 right-0 h-10 w-10 rounded-full bg-orange-400" />

          </div>

        </div>

      </div>
    );
  }

  if (
    template.previewType ===
    "project-update"
  ) {
    return (
      <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[10px] font-bold text-slate-700">
              Project Update
            </p>

            <p className="mt-1 text-[6px] text-slate-400">
              August 2026
            </p>

          </div>

          <div className="rounded-full bg-emerald-50 px-2 py-1 text-[6px] font-bold text-emerald-600">
            On track
          </div>

        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">

          {[
            ["Progress", "78%"],
            ["Tasks", "24"],
            ["Risks", "2"],
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item[0]
                }
                className="rounded-lg bg-indigo-50 p-2"
              >

                <p className="text-[6px] text-slate-400">
                  {item[0]}
                </p>

                <p className="mt-1 text-[10px] font-bold text-indigo-600">
                  {item[1]}
                </p>

              </div>
            )
          )}

        </div>

        <div className="mt-4 h-7 rounded-lg bg-slate-50 p-2">

          <div className="h-2 w-[72%] rounded bg-indigo-300" />

        </div>

      </div>
    );
  }

  if (
    template.previewType ===
    "research-presentation"
  ) {
    return (
      <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="mb-4 border-b border-sky-100 pb-2">

          <p className="text-[10px] font-bold text-slate-700">
            Research Results
          </p>

          <p className="mt-1 text-[6px] text-slate-400">
            Experimental findings
          </p>

        </div>

        <div className="flex gap-4">

          <div className="flex-1">

            <div className="flex h-20 items-end gap-1">

              {[
                35,
                60,
                48,
                78,
                66,
              ].map(
                (
                  height,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="flex-1 rounded-t bg-sky-300"
                    style={{
                      height:
                        `${height}%`,
                    }}
                  />
                )
              )}

            </div>

          </div>

          <div className="w-1/3 space-y-2">

            <div className="h-2 rounded bg-slate-200" />
            <div className="h-2 w-4/5 rounded bg-slate-200" />
            <div className="h-2 w-3/5 rounded bg-slate-200" />

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="flex h-full">

        <div className="flex w-2/5 flex-col justify-end bg-rose-100 p-4">

          <div className="h-14 w-14 rounded-full bg-rose-300" />

          <p className="mt-3 text-[10px] font-bold text-slate-800">
            Your Name
          </p>

          <p className="mt-1 text-[6px] text-slate-500">
            Product • Design • Research
          </p>

        </div>

        <div className="flex flex-1 flex-col justify-center p-4">

          <p className="text-[10px] font-bold text-slate-700">
            Selected Work
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">

            <div className="h-10 rounded bg-rose-50" />
            <div className="h-10 rounded bg-orange-50" />
            <div className="h-10 rounded bg-violet-50" />
            <div className="h-10 rounded bg-blue-50" />

          </div>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// ACCENT
// ======================================================

function getAccentClass(
  accent
) {
  const classes = {
    emerald:
      "bg-emerald-50 text-emerald-600",

    green:
      "bg-green-50 text-green-600",

    blue:
      "bg-blue-50 text-blue-600",

    violet:
      "bg-violet-50 text-violet-600",

    orange:
      "bg-orange-50 text-orange-600",

    indigo:
      "bg-indigo-50 text-indigo-600",

    sky:
      "bg-sky-50 text-sky-600",

    rose:
      "bg-rose-50 text-rose-600",
  };

  return (
    classes[accent] ||
    "bg-slate-50 text-slate-600"
  );
}

export default TemplateGalleryModal;