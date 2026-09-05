import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  Copy,
  Italic,
  Plus,
  Presentation,
  RefreshCw,
  Save,
  Trash2,
  Type,
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

// ======================================================
// CONSTANTS
// ======================================================

const MIN_ELEMENT_WIDTH = 4;
const MIN_ELEMENT_HEIGHT = 4;

// ======================================================
// HELPERS
// ======================================================

function getDisplayName(name) {
  if (!name) {
    return "Untitled presentation";
  }

  return name.replace(
    /\.cloudslides$/i,
    ""
  );
}

function clamp(
  value,
  min,
  max
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

// ======================================================
// DEFAULT SLIDE
// ======================================================

function createNewSlide() {
  const now =
    Date.now();

  return {
    id:
      `slide-${now}`,

    background: {
      type: "solid",
      value: "#ffffff",
    },

    elements: [
      {
        id:
          `title-${now}`,

        type: "text",

        x: 10,
        y: 25,

        width: 80,
        height: 16,

        text:
          "Click to add title",

        style: {
          fontSize: 34,
          fontWeight: "700",
          fontFamily:
            "Arial",
          textAlign:
            "center",
          color:
            "#0f172a",
          lineHeight: 1.2,
        },
      },

      {
        id:
          `subtitle-${now}`,

        type: "text",

        x: 15,
        y: 50,

        width: 70,
        height: 10,

        text:
          "Click to add subtitle",

        style: {
          fontSize: 18,
          fontWeight: "400",
          fontFamily:
            "Arial",
          textAlign:
            "center",
          color:
            "#64748b",
          lineHeight: 1.3,
        },
      },
    ],
  };
}

// ======================================================
// BACKGROUND
// ======================================================

function getSlideBackground(
  background
) {
  if (!background) {
    return "#ffffff";
  }

  // Support old/simple slide data
  if (
    typeof background ===
    "string"
  ) {
    return background;
  }

  if (
    background.type ===
    "gradient"
  ) {
    return (
      background.value ||
      "linear-gradient(135deg, #ffffff, #f8fafc)"
    );
  }

  return (
    background.value ||
    "#ffffff"
  );
}

// ======================================================
// PAGE
// ======================================================

function PresentationEditorPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    presentationId,
  } = useParams();

  // ======================================================
  // META
  // ======================================================

  const [
    presentation,
    setPresentation,
  ] = useState(null);

  // ======================================================
  // DATA
  // ======================================================

  const [
    presentationData,
    setPresentationData,
  ] = useState(null);

  const [
    originalData,
    setOriginalData,
  ] = useState(null);

  // ======================================================
  // SELECTION
  // ======================================================

  const [
    selectedElementId,
    setSelectedElementId,
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

  const loadPresentation =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/files/presentations/${presentationId}`
            );

          const loadedPresentation =
            response.data
              ?.presentation;

          if (
            !loadedPresentation
          ) {
            throw new Error(
              "Presentation data was not returned"
            );
          }

          const loadedData =
            loadedPresentation
              .data || {
              version: 1,

              slides: [
                createNewSlide(),
              ],

              activeSlideId:
                null,

              settings: {
                aspectRatio:
                  "16:9",
              },
            };

          // ==================================================
          // SUPPORT activeSlideIndex IF OLD DATA USES IT
          // ==================================================

          if (
            !loadedData.activeSlideId &&
            typeof loadedData
              .activeSlideIndex ===
              "number" &&
            loadedData.slides?.[
              loadedData.activeSlideIndex
            ]
          ) {
            loadedData.activeSlideId =
              loadedData.slides[
                loadedData
                  .activeSlideIndex
              ].id;
          }

          if (
            !loadedData.activeSlideId &&
            loadedData.slides?.[0]
          ) {
            loadedData.activeSlideId =
              loadedData
                .slides[0]
                .id;
          }

          setPresentation(
            loadedPresentation
          );

          setPresentationData(
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
            "Load presentation error:",
            err
          );

          if (
            err.response?.status ===
            401
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
              "Unable to load presentation."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        presentationId,
        navigate,
      ]
    );

  useEffect(() => {
    loadPresentation();
  }, [loadPresentation]);

  // ======================================================
  // ACTIVE SLIDE
  // ======================================================

  const activeSlide =
    useMemo(() => {
      if (
        !presentationData
          ?.slides?.length
      ) {
        return null;
      }

      return (
        presentationData
          .slides.find(
            (slide) =>
              slide.id ===
              presentationData
                .activeSlideId
          ) ||
        presentationData
          .slides[0]
      );
    }, [presentationData]);

  // ======================================================
  // SELECTED ELEMENT
  // ======================================================

  const selectedElement =
    useMemo(() => {
      if (
        !activeSlide ||
        !selectedElementId
      ) {
        return null;
      }

      return (
        activeSlide.elements?.find(
          (element) =>
            element.id ===
            selectedElementId
        ) || null
      );
    }, [
      activeSlide,
      selectedElementId,
    ]);

  // ======================================================
  // UNSAVED
  // ======================================================

  const hasUnsavedChanges =
    useMemo(() => {
      if (
        !presentationData ||
        !originalData
      ) {
        return false;
      }

      return (
        JSON.stringify(
          presentationData
        ) !==
        JSON.stringify(
          originalData
        )
      );
    }, [
      presentationData,
      originalData,
    ]);

  // ======================================================
  // UPDATE ACTIVE SLIDE
  // ======================================================

  const updateActiveSlide =
    (updater) => {
      if (!activeSlide) {
        return;
      }

      setPresentationData(
        (current) => ({
          ...current,

          slides:
            current.slides.map(
              (slide) =>
                slide.id ===
                activeSlide.id
                  ? updater(
                      slide
                    )
                  : slide
            ),
        })
      );
    };

  // ======================================================
  // UPDATE ELEMENT
  // ======================================================

  const updateElement =
    (
      elementId,
      updater
    ) => {
      if (
        !presentation
          ?.canEdit ||
        !activeSlide
      ) {
        return;
      }

      updateActiveSlide(
        (slide) => ({
          ...slide,

          elements:
            (
              slide.elements ||
              []
            ).map(
              (element) =>
                element.id ===
                elementId
                  ? updater(
                      element
                    )
                  : element
            ),
        })
      );
    };

  // ======================================================
  // TEXT CHANGE
  // ======================================================

  const handleTextChange = (
    elementId,
    text
  ) => {
    updateElement(
      elementId,
      (element) => ({
        ...element,
        text,
      })
    );
  };

  // ======================================================
  // STYLE CHANGE
  // ======================================================

  const updateSelectedTextStyle =
    (
      styleChanges
    ) => {
      if (
        !selectedElement ||
        selectedElement.type !==
          "text"
      ) {
        return;
      }

      updateElement(
        selectedElement.id,
        (element) => ({
          ...element,

          style: {
            ...element.style,
            ...styleChanges,
          },
        })
      );
    };

  // ======================================================
  // SAVE
  // ======================================================

  const handleSave =
    async () => {
      if (
        !presentation
          ?.canEdit ||
        !presentationData
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/files/presentations/${presentationId}/content`,
            {
              data:
                presentationData,
            }
          );

        const updatedPresentation =
          response.data
            ?.presentation;

        setOriginalData(
          JSON.parse(
            JSON.stringify(
              presentationData
            )
          )
        );

        if (
          updatedPresentation
        ) {
          setPresentation(
            (current) => ({
              ...current,
              ...updatedPresentation,
            })
          );
        }

        window.dispatchEvent(
  new Event(
    "cloud-drive-storage-changed"
  )
);

        setSuccess(
          "Presentation saved successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 2000);
      } catch (err) {
        console.error(
          "Save presentation error:",
          err
        );

        setError(
          err.response?.data
            ?.error?.message ||
            err.response?.data
              ?.message ||
            "Unable to save presentation."
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
        event.key
          .toLowerCase() ===
          "s";

      if (
        !isSaveShortcut
      ) {
        return;
      }

      event.preventDefault();

      if (
        presentation?.canEdit &&
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
    presentation?.canEdit,
    saving,
    presentationData,
  ]);

  // ======================================================
  // SELECT SLIDE
  // ======================================================

  const handleSelectSlide = (
    slideId
  ) => {
    setPresentationData(
      (current) => ({
        ...current,
        activeSlideId:
          slideId,
      })
    );

    setSelectedElementId(
      null
    );
  };

  // ======================================================
  // ADD SLIDE
  // ======================================================

  const handleAddSlide =
    () => {
      if (
        !presentation
          ?.canEdit
      ) {
        return;
      }

      const newSlide =
        createNewSlide();

      setPresentationData(
        (current) => ({
          ...current,

          slides: [
            ...current.slides,
            newSlide,
          ],

          activeSlideId:
            newSlide.id,
        })
      );

      setSelectedElementId(
        null
      );
    };

  // ======================================================
  // DUPLICATE
  // ======================================================

  const handleDuplicateSlide =
    () => {
      if (
        !presentation
          ?.canEdit ||
        !activeSlide
      ) {
        return;
      }

      const duplicated = {
        ...JSON.parse(
          JSON.stringify(
            activeSlide
          )
        ),

        id:
          `slide-${Date.now()}`,
      };

      duplicated.elements =
        (
          duplicated.elements ||
          []
        ).map(
          (
            element,
            index
          ) => ({
            ...element,

            id:
              `${element.type}-${Date.now()}-${index}`,
          })
        );

      setPresentationData(
        (current) => {
          const index =
            current.slides.findIndex(
              (slide) =>
                slide.id ===
                activeSlide.id
            );

          const slides = [
            ...current.slides,
          ];

          slides.splice(
            index + 1,
            0,
            duplicated
          );

          return {
            ...current,
            slides,
            activeSlideId:
              duplicated.id,
          };
        }
      );

      setSelectedElementId(
        null
      );
    };

  // ======================================================
  // DELETE SLIDE
  // ======================================================

  const handleDeleteSlide =
    () => {
      if (
        !presentation
          ?.canEdit ||
        !activeSlide
      ) {
        return;
      }

      if (
        presentationData
          .slides.length ===
        1
      ) {
        setError(
          "A presentation must contain at least one slide."
        );

        return;
      }

      setPresentationData(
        (current) => {
          const currentIndex =
            current.slides.findIndex(
              (slide) =>
                slide.id ===
                activeSlide.id
            );

          const remaining =
            current.slides.filter(
              (slide) =>
                slide.id !==
                activeSlide.id
            );

          const nextIndex =
            Math.min(
              currentIndex,
              remaining.length -
                1
            );

          return {
            ...current,

            slides:
              remaining,

            activeSlideId:
              remaining[
                nextIndex
              ]?.id,
          };
        }
      );

      setSelectedElementId(
        null
      );
    };

  // ======================================================
  // ADD TEXT
  // ======================================================

  const handleAddText =
    () => {
      if (
        !presentation
          ?.canEdit ||
        !activeSlide
      ) {
        return;
      }

      const newElement = {
        id:
          `text-${Date.now()}`,

        type:
          "text",

        x: 20,
        y: 35,

        width: 60,
        height: 12,

        text:
          "New text",

        style: {
          fontSize: 22,
          fontWeight:
            "400",
          fontFamily:
            "Arial",
          textAlign:
            "center",
          color:
            "#0f172a",
          lineHeight:
            1.2,
        },
      };

      updateActiveSlide(
        (slide) => ({
          ...slide,

          elements: [
            ...(slide.elements ||
              []),
            newElement,
          ],
        })
      );

      setSelectedElementId(
        newElement.id
      );
    };

  // ======================================================
  // BACK
  // ======================================================

  const handleBack =
    () => {
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
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading presentation...
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
    !presentation
  ) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] px-6 py-10">

        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={
              handleBack
            }
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-amber-600"
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
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">

        <div className="flex min-h-[74px] items-center justify-between gap-4 px-5 lg:px-7">

          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={
                handleBack
              }
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-amber-600"
            >
              <ArrowLeft
                size={21}
              />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

              <Presentation
                size={23}
              />

            </div>

            <div className="min-w-0">

              <h1 className="truncate text-lg font-bold text-slate-900">
                {getDisplayName(
                  presentation?.name
                )}
              </h1>

              <div className="mt-1">

                {presentation
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

          <div className="flex items-center gap-2">

            {presentation
              ?.canEdit && (
              <>
                <button
                  type="button"
                  onClick={
                    handleAddText
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Type
                    size={16}
                  />

                  Add text
                </button>

                <button
                  type="button"
                  onClick={
                    handleDuplicateSlide
                  }
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-100"
                  title="Duplicate slide"
                >
                  <Copy
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteSlide
                  }
                  className="rounded-xl border border-red-100 bg-white p-2.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Delete slide"
                >
                  <Trash2
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    !hasUnsavedChanges
                  }
                  className="flex min-w-[105px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
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
              </>
            )}

          </div>

        </div>

      </header>

      {/* ==================================================
          TEXT FORMAT TOOLBAR
      ================================================== */}

      {selectedElement?.type ===
        "text" &&
        presentation?.canEdit && (
          <div className="z-40 border-b border-slate-200 bg-white px-5 py-2">

            <div className="flex flex-wrap items-center gap-2">

              {/* FONT */}

              <select
                value={
                  selectedElement
                    .style
                    ?.fontFamily ||
                  "Arial"
                }
                onChange={(e) =>
                  updateSelectedTextStyle({
                    fontFamily:
                      e.target
                        .value,
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
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

                <option value="Verdana">
                  Verdana
                </option>
              </select>

              {/* SIZE */}

              <select
                value={
                  selectedElement
                    .style
                    ?.fontSize ||
                  20
                }
                onChange={(e) =>
                  updateSelectedTextStyle({
                    fontSize:
                      Number(
                        e.target
                          .value
                      ),
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                {[
                  10,
                  12,
                  14,
                  16,
                  18,
                  20,
                  22,
                  24,
                  28,
                  32,
                  36,
                  40,
                  44,
                  48,
                  56,
                  64,
                  72,
                ].map(
                  (size) => (
                    <option
                      key={
                        size
                      }
                      value={
                        size
                      }
                    >
                      {size}
                    </option>
                  )
                )}
              </select>

              <div className="h-7 w-px bg-slate-200" />

              {/* BOLD */}

              <ToolbarButton
                active={
                  selectedElement
                    .style
                    ?.fontWeight ===
                  "700"
                }
                onClick={() =>
                  updateSelectedTextStyle({
                    fontWeight:
                      selectedElement
                        .style
                        ?.fontWeight ===
                      "700"
                        ? "400"
                        : "700",
                  })
                }
              >
                <Bold
                  size={16}
                />
              </ToolbarButton>

              {/* ITALIC */}

              <ToolbarButton
                active={
                  selectedElement
                    .style
                    ?.fontStyle ===
                  "italic"
                }
                onClick={() =>
                  updateSelectedTextStyle({
                    fontStyle:
                      selectedElement
                        .style
                        ?.fontStyle ===
                      "italic"
                        ? "normal"
                        : "italic",
                  })
                }
              >
                <Italic
                  size={16}
                />
              </ToolbarButton>

              {/* UNDERLINE */}

              <ToolbarButton
                active={
                  selectedElement
                    .style
                    ?.textDecoration ===
                  "underline"
                }
                onClick={() =>
                  updateSelectedTextStyle({
                    textDecoration:
                      selectedElement
                        .style
                        ?.textDecoration ===
                      "underline"
                        ? "none"
                        : "underline",
                  })
                }
              >
                <Underline
                  size={16}
                />
              </ToolbarButton>

              <div className="h-7 w-px bg-slate-200" />

              {/* TEXT COLOR */}

              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">

                Text

                <span
                  className="h-4 w-4 rounded border border-slate-200"
                  style={{
                    backgroundColor:
                      selectedElement
                        .style
                        ?.color ||
                      "#0f172a",
                  }}
                />

                <input
                  type="color"
                  value={
                    selectedElement
                      .style
                      ?.color ||
                    "#0f172a"
                  }
                  onChange={(e) =>
                    updateSelectedTextStyle({
                      color:
                        e.target
                          .value,
                    })
                  }
                  className="h-0 w-0 opacity-0"
                />

              </label>

              <div className="h-7 w-px bg-slate-200" />

              {/* ALIGN */}

              <ToolbarButton
                active={
                  selectedElement
                    .style
                    ?.textAlign ===
                  "left"
                }
                onClick={() =>
                  updateSelectedTextStyle({
                    textAlign:
                      "left",
                  })
                }
              >
                <AlignLeft
                  size={16}
                />
              </ToolbarButton>

              <ToolbarButton
                active={
                  selectedElement
                    .style
                    ?.textAlign ===
                  "center"
                }
                onClick={() =>
                  updateSelectedTextStyle({
                    textAlign:
                      "center",
                  })
                }
              >
                <AlignCenter
                  size={16}
                />
              </ToolbarButton>

              <ToolbarButton
                active={
                  selectedElement
                    .style
                    ?.textAlign ===
                  "right"
                }
                onClick={() =>
                  updateSelectedTextStyle({
                    textAlign:
                      "right",
                  })
                }
              >
                <AlignRight
                  size={16}
                />
              </ToolbarButton>

              {/* SIZE INFO */}

              <div className="ml-2 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-500">
                {Math.round(
                  selectedElement
                    .width
                )}
                % ×{" "}
                {Math.round(
                  selectedElement
                    .height
                )}
                %
              </div>

            </div>

          </div>
        )}

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
          EDITOR
      ================================================== */}

      <main className="flex min-h-0 flex-1">

        {/* ==================================================
            SLIDE SIDEBAR
        ================================================== */}

        <aside className="w-[230px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">

          <div className="mb-4 flex items-center justify-between">

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Slides
            </p>

            {presentation
              ?.canEdit && (
              <button
                type="button"
                onClick={
                  handleAddSlide
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
              >
                <Plus
                  size={18}
                />
              </button>
            )}

          </div>

          <div className="space-y-4">

            {presentationData
              ?.slides?.map(
                (
                  slide,
                  index
                ) => {
                  const active =
                    slide.id ===
                    presentationData
                      .activeSlideId;

                  return (
                    <button
                      key={
                        slide.id
                      }
                      type="button"
                      onClick={() =>
                        handleSelectSlide(
                          slide.id
                        )
                      }
                      className="flex w-full gap-2 text-left"
                    >

                      <span className="mt-1 w-5 shrink-0 text-xs font-semibold text-slate-400">
                        {index +
                          1}
                      </span>

                      <SlideThumbnail
                        slide={
                          slide
                        }
                        active={
                          active
                        }
                      />

                    </button>
                  );
                }
              )}

          </div>

        </aside>

        {/* ==================================================
            CANVAS
        ================================================== */}

        <section
          className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-8"
          onClick={() =>
            setSelectedElementId(
              null
            )
          }
        >

          {activeSlide && (
            <div className="w-full max-w-[1100px]">

              <div
                data-slide-canvas="true"
                className="relative aspect-video w-full overflow-hidden rounded-sm border border-slate-200 shadow-2xl"
                style={{
                  background:
                    getSlideBackground(
                      activeSlide.background
                    ),
                }}
              >

                {activeSlide
                  .elements?.map(
                    (element) => (
                      <SlideElement
                        key={
                          element.id
                        }
                        element={
                          element
                        }
                        selected={
                          selectedElementId ===
                          element.id
                        }
                        editable={
                          presentation
                            ?.canEdit
                        }
                        onSelect={() =>
                          setSelectedElementId(
                            element.id
                          )
                        }
                        onTextChange={
                          handleTextChange
                        }
                        updateElement={
                          updateElement
                        }
                      />
                    )
                  )}

              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">

                <span>
                  Slide{" "}
                  {presentationData
                    ?.slides.findIndex(
                      (slide) =>
                        slide.id ===
                        activeSlide.id
                    ) + 1}{" "}
                  of{" "}
                  {
                    presentationData
                      ?.slides
                      ?.length
                  }
                </span>

                <span>
                  16:9
                </span>

              </div>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

// ======================================================
// SLIDE ELEMENT
// ======================================================

function SlideElement({
  element,
  selected,
  editable,
  onSelect,
  onTextChange,
  updateElement,
}) {
  // ==================================================
  // SHAPE
  // ==================================================

  if (
    element.type ===
    "shape"
  ) {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation();

          onSelect();
        }}
        className={`
          absolute

          ${
            selected
              ? "ring-2 ring-amber-400 ring-offset-1"
              : ""
          }
        `}
        style={{
          left:
            `${element.x}%`,

          top:
            `${element.y}%`,

          width:
            `${element.width}%`,

          height:
            `${element.height}%`,

          background:
            element.style
              ?.background ||
            element.style
              ?.backgroundColor ||
            element.style
              ?.fill ||
            "#e2e8f0",

          borderRadius:
            element.style
              ?.borderRadius ||
            0,

          border:
            element.style
              ?.border ||
            (
              element.style
                ?.borderWidth
                ? `${element.style.borderWidth}px solid ${
                    element.style
                      ?.borderColor ||
                    "#cbd5e1"
                  }`
                : "none"
            ),

          opacity:
            element.style
              ?.opacity ??
            1,

          transform:
            element.style
              ?.transform ||
            undefined,

          boxShadow:
            element.style
              ?.boxShadow ||
            undefined,
        }}
      />
    );
  }

  // ==================================================
  // LINE
  // ==================================================

  if (
    element.type ===
    "line"
  ) {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className="absolute"
        style={{
          left:
            `${element.x}%`,

          top:
            `${element.y}%`,

          width:
            `${element.width}%`,

          borderTop:
            `${
              element.style
                ?.borderWidth ||
              2
            }px solid ${
              element.style
                ?.color ||
              "#cbd5e1"
            }`,
        }}
      />
    );
  }

  // ==================================================
  // TEXT
  // ==================================================

  if (
    element.type ===
    "text"
  ) {
    // ==================================================
    // RESIZE
    // ==================================================

    const handleResize = (
      direction,
      mouseDownEvent
    ) => {
      if (!editable) {
        return;
      }

      mouseDownEvent.preventDefault();
      mouseDownEvent.stopPropagation();

      onSelect();

      const canvas =
        mouseDownEvent.currentTarget.closest(
          '[data-slide-canvas="true"]'
        );

      if (!canvas) {
        return;
      }

      const canvasRect =
        canvas.getBoundingClientRect();

      const startMouseX =
        mouseDownEvent.clientX;

      const startMouseY =
        mouseDownEvent.clientY;

      const startX =
        Number(
          element.x ||
            0
        );

      const startY =
        Number(
          element.y ||
            0
        );

      const startWidth =
        Number(
          element.width ||
            20
        );

      const startHeight =
        Number(
          element.height ||
            10
        );

      const handleMouseMove =
        (moveEvent) => {
          const deltaX =
            (
              (
                moveEvent.clientX -
                startMouseX
              ) /
              canvasRect.width
            ) *
            100;

          const deltaY =
            (
              (
                moveEvent.clientY -
                startMouseY
              ) /
              canvasRect.height
            ) *
            100;

          let newX =
            startX;

          let newY =
            startY;

          let newWidth =
            startWidth;

          let newHeight =
            startHeight;

          // ==============================================
          // RIGHT
          // ==============================================

          if (
            direction.includes(
              "right"
            )
          ) {
            newWidth =
              clamp(
                startWidth +
                  deltaX,

                MIN_ELEMENT_WIDTH,

                100 -
                  startX
              );
          }

          // ==============================================
          // LEFT
          // ==============================================

          if (
            direction.includes(
              "left"
            )
          ) {
            const proposedX =
              clamp(
                startX +
                  deltaX,
                0,
                startX +
                  startWidth -
                  MIN_ELEMENT_WIDTH
              );

            newWidth =
              startWidth +
              (
                startX -
                proposedX
              );

            newX =
              proposedX;
          }

          // ==============================================
          // BOTTOM
          // ==============================================

          if (
            direction.includes(
              "bottom"
            )
          ) {
            newHeight =
              clamp(
                startHeight +
                  deltaY,

                MIN_ELEMENT_HEIGHT,

                100 -
                  startY
              );
          }

          // ==============================================
          // TOP
          // ==============================================

          if (
            direction.includes(
              "top"
            )
          ) {
            const proposedY =
              clamp(
                startY +
                  deltaY,
                0,
                startY +
                  startHeight -
                  MIN_ELEMENT_HEIGHT
              );

            newHeight =
              startHeight +
              (
                startY -
                proposedY
              );

            newY =
              proposedY;
          }

          updateElement(
            element.id,
            (current) => ({
              ...current,

              x:
                Number(
                  newX.toFixed(
                    2
                  )
                ),

              y:
                Number(
                  newY.toFixed(
                    2
                  )
                ),

              width:
                Number(
                  newWidth.toFixed(
                    2
                  )
                ),

              height:
                Number(
                  newHeight.toFixed(
                    2
                  )
                ),
            })
          );
        };

      const handleMouseUp =
        () => {
          window.removeEventListener(
            "mousemove",
            handleMouseMove
          );

          window.removeEventListener(
            "mouseup",
            handleMouseUp
          );
        };

      window.addEventListener(
        "mousemove",
        handleMouseMove
      );

      window.addEventListener(
        "mouseup",
        handleMouseUp
      );
    };

    return (
      <div
        className={`
          absolute

          ${
            selected
              ? "z-30"
              : "z-10"
          }
        `}
        style={{
          left:
            `${element.x}%`,

          top:
            `${element.y}%`,

          width:
            `${element.width}%`,

          height:
            `${element.height}%`,
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >

        <textarea
          value={
            element.text ||
            ""
          }
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          onFocus={
            onSelect
          }
          onChange={(event) =>
            onTextChange(
              element.id,
              event.target.value
            )
          }
          readOnly={
            !editable
          }
          className={`
            h-full
            w-full
            resize-none
            overflow-hidden
            bg-transparent
            p-1
            outline-none
            transition

            ${
              selected
                ? "border-2 border-amber-400"
                : "border border-transparent hover:border-amber-200"
            }
          `}
          style={{
            fontSize:
              `${element.style?.fontSize || 20}px`,

            fontWeight:
              element.style
                ?.fontWeight ||
              (
                element.style
                  ?.bold
                  ? "700"
                  : "400"
              ),

            fontFamily:
              element.style
                ?.fontFamily ||
              "Arial",

            fontStyle:
              element.style
                ?.fontStyle ||
              (
                element.style
                  ?.italic
                  ? "italic"
                  : "normal"
              ),

            textDecoration:
              element.style
                ?.textDecoration ||
              (
                element.style
                  ?.underline
                  ? "underline"
                  : "none"
              ),

            textAlign:
              element.style
                ?.textAlign ||
              element.style
                ?.align ||
              "left",

            color:
              element.style
                ?.color ||
              "#0f172a",

            lineHeight:
              element.style
                ?.lineHeight ||
              1.2,

            letterSpacing:
              element.style
                ?.letterSpacing ||
              undefined,
          }}
        />

        {/* ==================================================
            RESIZE HANDLES
        ================================================== */}

        {selected &&
          editable && (
            <>
              <ResizeHandle
                position="top-left"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "top-left",
                    event
                  )
                }
              />

              <ResizeHandle
                position="top"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "top",
                    event
                  )
                }
              />

              <ResizeHandle
                position="top-right"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "top-right",
                    event
                  )
                }
              />

              <ResizeHandle
                position="right"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "right",
                    event
                  )
                }
              />

              <ResizeHandle
                position="bottom-right"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "bottom-right",
                    event
                  )
                }
              />

              <ResizeHandle
                position="bottom"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "bottom",
                    event
                  )
                }
              />

              <ResizeHandle
                position="bottom-left"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "bottom-left",
                    event
                  )
                }
              />

              <ResizeHandle
                position="left"
                onMouseDown={(
                  event
                ) =>
                  handleResize(
                    "left",
                    event
                  )
                }
              />
            </>
          )}

      </div>
    );
  }

  return null;
}

// ======================================================
// RESIZE HANDLE
// ======================================================

function ResizeHandle({
  position,
  onMouseDown,
}) {
  const positions = {
    "top-left":
      "-left-1.5 -top-1.5 cursor-nwse-resize",

    top:
      "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize",

    "top-right":
      "-right-1.5 -top-1.5 cursor-nesw-resize",

    right:
      "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",

    "bottom-right":
      "-bottom-1.5 -right-1.5 cursor-nwse-resize",

    bottom:
      "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",

    "bottom-left":
      "-bottom-1.5 -left-1.5 cursor-nesw-resize",

    left:
      "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
  };

  return (
    <button
      type="button"
      onMouseDown={
        onMouseDown
      }
      onClick={(event) =>
        event.stopPropagation()
      }
      className={`
        absolute
        z-50
        h-3
        w-3
        rounded-sm
        border
        border-amber-600
        bg-white
        shadow-sm

        ${
          positions[
            position
          ]
        }
      `}
      aria-label={`Resize ${position}`}
    />
  );
}

// ======================================================
// SLIDE THUMBNAIL
// ======================================================

function SlideThumbnail({
  slide,
  active,
}) {
  return (
    <div
      className={`
        relative
        aspect-video
        flex-1
        overflow-hidden
        rounded-lg
        border-2
        shadow-sm
        transition

        ${
          active
            ? "border-amber-500"
            : "border-slate-200 hover:border-slate-300"
        }
      `}
      style={{
        background:
          getSlideBackground(
            slide.background
          ),
      }}
    >

      {slide.elements?.map(
        (element) => {
          // ==================================================
          // SHAPE
          // ==================================================

          if (
            element.type ===
            "shape"
          ) {
            return (
              <div
                key={
                  element.id
                }
                className="absolute"
                style={{
                  left:
                    `${element.x}%`,

                  top:
                    `${element.y}%`,

                  width:
                    `${element.width}%`,

                  height:
                    `${element.height}%`,

                  background:
                    element.style
                      ?.background ||
                    element.style
                      ?.backgroundColor ||
                    element.style
                      ?.fill ||
                    "#e2e8f0",

                  borderRadius:
                    element.style
                      ?.borderRadius ||
                    0,

                  opacity:
                    element.style
                      ?.opacity ??
                    1,
                }}
              />
            );
          }

          // ==================================================
          // LINE
          // ==================================================

          if (
            element.type ===
            "line"
          ) {
            return (
              <div
                key={
                  element.id
                }
                className="absolute"
                style={{
                  left:
                    `${element.x}%`,

                  top:
                    `${element.y}%`,

                  width:
                    `${element.width}%`,

                  borderTop:
                    `${
                      Math.max(
                        1,
                        (
                          element
                            .style
                            ?.borderWidth ||
                          2
                        ) /
                          4
                      )
                    }px solid ${
                      element.style
                        ?.color ||
                      "#cbd5e1"
                    }`,
                }}
              />
            );
          }

          // ==================================================
          // TEXT
          // ==================================================

          if (
            element.type ===
            "text"
          ) {
            return (
              <div
                key={
                  element.id
                }
                className="absolute overflow-hidden whitespace-pre-wrap"
                style={{
                  left:
                    `${element.x}%`,

                  top:
                    `${element.y}%`,

                  width:
                    `${element.width}%`,

                  height:
                    `${element.height}%`,

                  fontSize:
                    `${Math.max(
                      4,
                      (element.style
                        ?.fontSize ||
                        16) /
                        6
                    )}px`,

                  fontWeight:
                    element.style
                      ?.fontWeight ||
                    (
                      element.style
                        ?.bold
                        ? "700"
                        : "400"
                    ),

                  textAlign:
                    element.style
                      ?.textAlign ||
                    element.style
                      ?.align ||
                    "left",

                  color:
                    element.style
                      ?.color ||
                    "#0f172a",

                  lineHeight:
                    1.1,
                }}
              >
                {
                  element.text
                }
              </div>
            );
          }

          return null;
        }
      )}

    </div>
  );
}

// ======================================================
// TOOLBAR BUTTON
// ======================================================

function ToolbarButton({
  children,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
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
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }
      `}
    >
      {
        children
      }
    </button>
  );
}

export default PresentationEditorPage;