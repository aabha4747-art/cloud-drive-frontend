import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  List,
  Monitor,
  Moon,
  Palette,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";

import {
  Outlet,
} from "react-router-dom";

import Sidebar from "./Sidebar";

// ======================================================
// DEFAULT SETTINGS
// ======================================================

const DEFAULT_SETTINGS = {
  theme:
    "light",

  accent:
    "violet",

  density:
    "comfortable",

  defaultView:
    "list",

  foldersFirst:
    true,

  showFileSize:
    true,

  showFileExtensions:
    true,

  confirmTrash:
    true,

  confirmPermanentDelete:
    true,

  enableGemini:
    true,

  geminiResponseLength:
    "balanced",

  successNotifications:
    true,

  errorNotifications:
    true,

  // ====================================================
  // SECURITY SETTINGS
  // ====================================================

  loginAlerts:
    true,

  sessionProtection:
    true,

  // ====================================================
  // AI PRIVACY SETTINGS
  // ====================================================

  allowGeminiFileContent:
    true,

  allowGeminiFolderAnalysis:
    true,

  showAIContentWarning:
    false,
};

// ======================================================
// ACCENT CONFIG
// ======================================================

const ACCENTS = {
  violet: {
    label:
      "Violet",

    primary:
      "#7c3aed",

    secondary:
      "#6366f1",

    soft:
      "#f5f3ff",
  },

  blue: {
    label:
      "Blue",

    primary:
      "#2563eb",

    secondary:
      "#0ea5e9",

    soft:
      "#eff6ff",
  },

  emerald: {
    label:
      "Green",

    primary:
      "#059669",

    secondary:
      "#10b981",

    soft:
      "#ecfdf5",
  },

  orange: {
    label:
      "Orange",

    primary:
      "#ea580c",

    secondary:
      "#f59e0b",

    soft:
      "#fff7ed",
  },

  pink: {
    label:
      "Pink",

    primary:
      "#db2777",

    secondary:
      "#ec4899",

    soft:
      "#fdf2f8",
  },
};

// ======================================================
// APP LAYOUT
// ======================================================

function AppLayout() {
  const [
    settings,
    setSettings,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          "cloudDriveSettings"
        );

      if (!saved) {
        return {
          ...DEFAULT_SETTINGS,
        };
      }

      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(
          saved
        ),
      };
    } catch {
      return {
        ...DEFAULT_SETTINGS,
      };
    }
  });

  const [
    showSettings,
    setShowSettings,
  ] = useState(false);

  // ======================================================
  // SYSTEM THEME
  // ======================================================

  const [
    systemDark,
    setSystemDark,
  ] = useState(() =>
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
  );

  useEffect(() => {
    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleChange =
      (event) => {
        setSystemDark(
          event.matches
        );
      };

    media.addEventListener(
      "change",
      handleChange
    );

    return () => {
      media.removeEventListener(
        "change",
        handleChange
      );
    };
  }, []);

  // ======================================================
  // RESOLVED THEME
  // ======================================================

  const isDark =
    settings.theme ===
      "dark" ||
    (
      settings.theme ===
        "system" &&
      systemDark
    );

  // ======================================================
  // SAVE SETTINGS
  // ======================================================

  useEffect(() => {
    localStorage.setItem(
      "cloudDriveSettings",
      JSON.stringify(
        settings
      )
    );

    localStorage.setItem(
      "driveViewMode",
      settings.defaultView
    );

    localStorage.setItem(
      "cloudDriveDensity",
      settings.density
    );

    localStorage.setItem(
      "cloudDriveGeminiEnabled",
      String(
        settings.enableGemini
      )
    );
  }, [
    settings,
  ]);

  // ======================================================
  // ROOT THEME
  // ======================================================

  useEffect(() => {
    document.documentElement.dataset.cloudTheme =
      isDark
        ? "dark"
        : "light";

    document.documentElement.dataset.cloudDensity =
      settings.density;

    document.body.style.background =
      isDark
        ? "#0f172a"
        : "#f6f8fc";

    return () => {
      delete document
        .documentElement
        .dataset
        .cloudTheme;
    };
  }, [
    isDark,
    settings.density,
  ]);

  // ======================================================
  // UPDATE SETTING
  // ======================================================

  const updateSetting =
    (
      name,
      value
    ) => {
      setSettings(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );
    };

  // ======================================================
  // RESET SETTINGS
  // ======================================================

  const resetSettings =
    () => {
      setSettings({
        ...DEFAULT_SETTINGS,
      });
    };

  // ======================================================
  // ACCENT
  // ======================================================

  const accent =
    useMemo(
      () =>
        ACCENTS[
          settings.accent
        ] ||
        ACCENTS.violet,
      [
        settings.accent,
      ]
    );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{
        backgroundColor:
          isDark
            ? "#0f172a"
            : "#f6f8fc",

        color:
          isDark
            ? "#e2e8f0"
            : "#0f172a",

        "--cloud-accent":
          accent.primary,

        "--cloud-accent-secondary":
          accent.secondary,

        "--cloud-accent-soft":
          accent.soft,
      }}
    >

      {/* ==================================================
          DARK THEME OVERRIDES
      ================================================== */}

      <style>
        {`
          [data-cloud-theme="dark"] body {
            background: #0f172a;
            color: #e2e8f0;
          }

          [data-cloud-theme="dark"] .bg-white {
            background-color: #111827 !important;
          }

          [data-cloud-theme="dark"] .bg-slate-50 {
            background-color: #1e293b !important;
          }

          [data-cloud-theme="dark"] .bg-slate-100 {
            background-color: #1e293b !important;
          }

          [data-cloud-theme="dark"] .bg-slate-200 {
            background-color: #334155 !important;
          }

          [data-cloud-theme="dark"] .text-slate-900 {
            color: #f8fafc !important;
          }

          [data-cloud-theme="dark"] .text-slate-800 {
            color: #f1f5f9 !important;
          }

          [data-cloud-theme="dark"] .text-slate-700 {
            color: #e2e8f0 !important;
          }

          [data-cloud-theme="dark"] .text-slate-600 {
            color: #cbd5e1 !important;
          }

          [data-cloud-theme="dark"] .text-slate-500 {
            color: #94a3b8 !important;
          }

          [data-cloud-theme="dark"] .text-slate-400 {
            color: #94a3b8 !important;
          }

          [data-cloud-theme="dark"] .border-slate-100 {
            border-color: #1e293b !important;
          }

          [data-cloud-theme="dark"] .border-slate-200 {
            border-color: #334155 !important;
          }

          [data-cloud-theme="dark"] .border-slate-300 {
            border-color: #475569 !important;
          }

          [data-cloud-theme="dark"] .hover\\:bg-slate-50:hover,
          [data-cloud-theme="dark"] .hover\\:bg-slate-100:hover {
            background-color: #273449 !important;
          }

          [data-cloud-theme="dark"] input,
          [data-cloud-theme="dark"] textarea,
          [data-cloud-theme="dark"] select {
            background-color: #1e293b;
            color: #f1f5f9;
            border-color: #334155;
          }

          [data-cloud-theme="dark"] input::placeholder,
          [data-cloud-theme="dark"] textarea::placeholder {
            color: #64748b;
          }

          [data-cloud-theme="dark"] .bg-indigo-50,
          [data-cloud-theme="dark"] .bg-violet-50,
          [data-cloud-theme="dark"] .bg-blue-50,
          [data-cloud-theme="dark"] .bg-emerald-50,
          [data-cloud-theme="dark"] .bg-green-50,
          [data-cloud-theme="dark"] .bg-amber-50,
          [data-cloud-theme="dark"] .bg-orange-50,
          [data-cloud-theme="dark"] .bg-sky-50 {
            background-color: #1e293b !important;
          }

          [data-cloud-theme="dark"] .shadow-sm,
          [data-cloud-theme="dark"] .shadow-md,
          [data-cloud-theme="dark"] .shadow-lg,
          [data-cloud-theme="dark"] .shadow-xl,
          [data-cloud-theme="dark"] .shadow-2xl {
            --tw-shadow-color: rgba(0,0,0,0.45) !important;
          }

          [data-cloud-density="compact"] .cloud-density-item {
            padding-top: 0.45rem !important;
            padding-bottom: 0.45rem !important;
          }

          [data-cloud-density="comfortable"] .cloud-density-item {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }
        `}
      </style>

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <div className="sticky top-0 z-40 h-screen">

        <Sidebar
          isDark={
            isDark
          }
          accent={
            accent
          }
          onOpenSettings={() =>
            setShowSettings(
              true
            )
          }
        />

      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <main className="min-w-0 flex-1 overflow-x-hidden">

        <Outlet
          context={{
            settings,
            updateSetting,
            isDark,
            accent,
          }}
        />

      </main>

      {/* ==================================================
          SETTINGS DRAWER
      ================================================== */}

      {showSettings && (
        <SettingsDrawer
          settings={
            settings
          }
          isDark={
            isDark
          }
          accent={
            accent
          }
          onChange={
            updateSetting
          }
          onReset={
            resetSettings
          }
          onClose={() =>
            setShowSettings(
              false
            )
          }
        />
      )}

    </div>
  );
}

// ======================================================
// SETTINGS DRAWER
// ======================================================

function SettingsDrawer({
  settings,
  isDark,
  accent,
  onChange,
  onReset,
  onClose,
}) {
  const [
    privacySection,
    setPrivacySection,
  ] = useState(null);

  return (
    <div className="fixed inset-0 z-[250]">

      {/* ==================================================
          BACKDROP
      ================================================== */}

      <button
        type="button"
        aria-label="Close settings"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
      />

      {/* ==================================================
          PANEL
      ================================================== */}

      <aside
        className={`
          absolute
          right-0
          top-0
          flex
          h-full
          w-full
          max-w-[460px]
          flex-col
          border-l
          shadow-2xl
          transition-colors

          ${
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
          }
        `}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className={`
            flex
            items-center
            justify-between
            border-b
            px-6
            py-5

            ${
              isDark
                ? "border-slate-700"
                : "border-slate-100"
            }
          `}
        >

          <div className="flex items-center gap-3">

            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{
                background:
                  `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
              }}
            >
              <Settings
                size={21}
              />
            </div>

            <div>

              <h2
                className={`text-xl font-bold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                Settings
              </h2>

              <p className="text-sm text-slate-400">
                Customize Cloud Drive
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className={`rounded-xl p-2 transition ${
              isDark
                ? "text-slate-400 hover:bg-slate-800"
                : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            <X
              size={21}
            />
          </button>

        </div>

        {/* ==================================================
            SCROLL AREA
        ================================================== */}

        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ==================================================
              APPEARANCE
          ================================================== */}

          <SettingsSection
            icon={
              Palette
            }
            title="Appearance"
            isDark={
              isDark
            }
          >

            <SettingLabel
              isDark={
                isDark
              }
            >
              Theme
            </SettingLabel>

            <div className="grid grid-cols-3 gap-2">

              <ChoiceCard
                icon={
                  Sun
                }
                label="Light"
                active={
                  settings.theme ===
                  "light"
                }
                isDark={
                  isDark
                }
                accent={
                  accent
                }
                onClick={() =>
                  onChange(
                    "theme",
                    "light"
                  )
                }
              />

              <ChoiceCard
                icon={
                  Moon
                }
                label="Dark"
                active={
                  settings.theme ===
                  "dark"
                }
                isDark={
                  isDark
                }
                accent={
                  accent
                }
                onClick={() =>
                  onChange(
                    "theme",
                    "dark"
                  )
                }
              />

              <ChoiceCard
                icon={
                  Monitor
                }
                label="System"
                active={
                  settings.theme ===
                  "system"
                }
                isDark={
                  isDark
                }
                accent={
                  accent
                }
                onClick={() =>
                  onChange(
                    "theme",
                    "system"
                  )
                }
              />

            </div>

            <SettingLabel
              isDark={
                isDark
              }
            >
              Accent color
            </SettingLabel>

            <div className="flex flex-wrap gap-3">

              {Object.entries(
                ACCENTS
              ).map(
                ([
                  key,
                  item,
                ]) => (
                  <button
                    key={
                      key
                    }
                    type="button"
                    title={
                      item.label
                    }
                    onClick={() =>
                      onChange(
                        "accent",
                        key
                      )
                    }
                    className={`
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      transition
                      hover:scale-110

                      ${
                        settings.accent ===
                        key
                          ? isDark
                            ? "border-white"
                            : "border-slate-900"
                          : "border-transparent"
                      }
                    `}
                    style={{
                      backgroundColor:
                        item.primary,
                    }}
                  >

                    {settings.accent ===
                      key && (
                      <Check
                        size={17}
                        className="text-white"
                        strokeWidth={3}
                      />
                    )}

                  </button>
                )
              )}

            </div>

            <SettingLabel
              isDark={
                isDark
              }
            >
              Layout density
            </SettingLabel>

            <SegmentedControl
              value={
                settings.density
              }
              options={[
                {
                  value:
                    "comfortable",

                  label:
                    "Comfortable",
                },

                {
                  value:
                    "compact",

                  label:
                    "Compact",
                },
              ]}
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "density",
                  value
                )
              }
            />

          </SettingsSection>

          {/* ==================================================
              DRIVE PREFERENCES
          ================================================== */}

          <SettingsSection
            icon={
              SlidersHorizontal
            }
            title="Drive preferences"
            isDark={
              isDark
            }
          >

            <SettingLabel
              isDark={
                isDark
              }
            >
              Default view
            </SettingLabel>

            <div className="grid grid-cols-2 gap-2">

              <ChoiceCard
                icon={
                  List
                }
                label="List"
                active={
                  settings.defaultView ===
                  "list"
                }
                isDark={
                  isDark
                }
                accent={
                  accent
                }
                onClick={() =>
                  onChange(
                    "defaultView",
                    "list"
                  )
                }
              />

              <ChoiceCard
                icon={
                  Grid3X3
                }
                label="Grid"
                active={
                  settings.defaultView ===
                  "grid"
                }
                isDark={
                  isDark
                }
                accent={
                  accent
                }
                onClick={() =>
                  onChange(
                    "defaultView",
                    "grid"
                  )
                }
              />

            </div>

            <ToggleSetting
              label="Folders first"
              description="Show folders above files."
              checked={
                settings.foldersFirst
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "foldersFirst",
                  value
                )
              }
            />

            <ToggleSetting
              label="Show file size"
              description="Display file sizes in Drive."
              checked={
                settings.showFileSize
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "showFileSize",
                  value
                )
              }
            />

            <ToggleSetting
              label="Show file extensions"
              description="Keep extensions visible in filenames."
              checked={
                settings.showFileExtensions
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "showFileExtensions",
                  value
                )
              }
            />

          </SettingsSection>

          {/* ==================================================
              TRASH
          ================================================== */}

          <SettingsSection
            icon={
              Trash2
            }
            title="Trash & deletion"
            isDark={
              isDark
            }
          >

            <ToggleSetting
              label="Confirm before Trash"
              description="Ask before moving items to Trash."
              checked={
                settings.confirmTrash
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "confirmTrash",
                  value
                )
              }
            />

            <ToggleSetting
              label="Confirm permanent deletion"
              description="Always confirm Delete forever."
              checked={
                settings.confirmPermanentDelete
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "confirmPermanentDelete",
                  value
                )
              }
            />

          </SettingsSection>

          {/* ==================================================
              GEMINI
          ================================================== */}

          <SettingsSection
            icon={
              Sparkles
            }
            title="Gemini AI"
            isDark={
              isDark
            }
          >

            <ToggleSetting
              label="Enable Ask Gemini"
              description="Allow Gemini actions for selected Drive items."
              checked={
                settings.enableGemini
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "enableGemini",
                  value
                )
              }
            />

            <SettingLabel
              isDark={
                isDark
              }
            >
              Response length
            </SettingLabel>

            <SegmentedControl
              value={
                settings.geminiResponseLength
              }
              options={[
                {
                  value:
                    "short",

                  label:
                    "Short",
                },

                {
                  value:
                    "balanced",

                  label:
                    "Balanced",
                },

                {
                  value:
                    "detailed",

                  label:
                    "Detailed",
                },
              ]}
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "geminiResponseLength",
                  value
                )
              }
            />

          </SettingsSection>

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <SettingsSection
            icon={
              Bell
            }
            title="Notifications"
            isDark={
              isDark
            }
          >

            <ToggleSetting
              label="Success notifications"
              description="Show confirmations after completed actions."
              checked={
                settings.successNotifications
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "successNotifications",
                  value
                )
              }
            />

            <ToggleSetting
              label="Error notifications"
              description="Show messages when an action fails."
              checked={
                settings.errorNotifications
              }
              isDark={
                isDark
              }
              accent={
                accent
              }
              onChange={(value) =>
                onChange(
                  "errorNotifications",
                  value
                )
              }
            />

          </SettingsSection>

          {/* ==================================================
              PRIVACY & SECURITY
          ================================================== */}

          <SettingsSection
            icon={
              ShieldCheck
            }
            title="Privacy & security"
            isDark={
              isDark
            }
          >

            {/* ==================================================
                SECURITY SETTINGS
            ================================================== */}

            <SettingsNavigationRow
              icon={
                ShieldCheck
              }
              label="Security settings"
              description="Manage account and session security."
              isDark={
                isDark
              }
              expanded={
                privacySection ===
                "security"
              }
              onClick={() =>
                setPrivacySection(
                  (current) =>
                    current ===
                    "security"
                      ? null
                      : "security"
                )
              }
            />

            {privacySection ===
              "security" && (
              <div
                className={`
                  ml-3
                  rounded-xl
                  border
                  p-4

                  ${
                    isDark
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >

                <ToggleSetting
                  label="Login alerts"
                  description="Show alerts when a new login is detected."
                  checked={
                    settings.loginAlerts
                  }
                  isDark={
                    isDark
                  }
                  accent={
                    accent
                  }
                  onChange={(value) =>
                    onChange(
                      "loginAlerts",
                      value
                    )
                  }
                />

                <div className="h-4" />

                <ToggleSetting
                  label="Session protection"
                  description="Require authentication again for sensitive actions."
                  checked={
                    settings.sessionProtection
                  }
                  isDark={
                    isDark
                  }
                  accent={
                    accent
                  }
                  onChange={(value) =>
                    onChange(
                      "sessionProtection",
                      value
                    )
                  }
                />

                <div className="mt-4">

                  <button
                    type="button"
                    className={`
                      w-full
                      rounded-xl
                      border
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      transition

                      ${
                        isDark
                          ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    View active sessions
                  </button>

                </div>

              </div>
            )}

            {/* ==================================================
                AI PRIVACY
            ================================================== */}

            <SettingsNavigationRow
              icon={
                Bot
              }
              label="AI privacy"
              description="Control how selected file content is used by AI."
              isDark={
                isDark
              }
              expanded={
                privacySection ===
                "ai"
              }
              onClick={() =>
                setPrivacySection(
                  (current) =>
                    current ===
                    "ai"
                      ? null
                      : "ai"
                )
              }
            />

            {privacySection ===
              "ai" && (
              <div
                className={`
                  ml-3
                  rounded-xl
                  border
                  p-4

                  ${
                    isDark
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >

                <ToggleSetting
                  label="Allow file content for Gemini"
                  description="Let Gemini read supported selected files when you ask questions."
                  checked={
                    settings.allowGeminiFileContent
                  }
                  isDark={
                    isDark
                  }
                  accent={
                    accent
                  }
                  onChange={(value) =>
                    onChange(
                      "allowGeminiFileContent",
                      value
                    )
                  }
                />

                <div className="h-4" />

                <ToggleSetting
                  label="Allow folder analysis"
                  description="Let Gemini analyze files contained inside selected folders."
                  checked={
                    settings.allowGeminiFolderAnalysis
                  }
                  isDark={
                    isDark
                  }
                  accent={
                    accent
                  }
                  onChange={(value) =>
                    onChange(
                      "allowGeminiFolderAnalysis",
                      value
                    )
                  }
                />

                <div className="h-4" />

                <ToggleSetting
                  label="Show AI content warning"
                  description="Show a notice before selected file content is sent for AI analysis."
                  checked={
                    settings.showAIContentWarning
                  }
                  isDark={
                    isDark
                  }
                  accent={
                    accent
                  }
                  onChange={(value) =>
                    onChange(
                      "showAIContentWarning",
                      value
                    )
                  }
                />

              </div>
            )}

          </SettingsSection>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div
          className={`
            flex
            items-center
            justify-between
            border-t
            px-6
            py-4

            ${
              isDark
                ? "border-slate-700"
                : "border-slate-100"
            }
          `}
        >

          <button
            type="button"
            onClick={
              onReset
            }
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Reset defaults
          </button>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            style={{
              background:
                `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
            }}
          >
            Done
          </button>

        </div>

      </aside>

    </div>
  );
}

// ======================================================
// SETTINGS SECTION
// ======================================================

function SettingsSection({
  icon: Icon,
  title,
  isDark,
  children,
}) {
  return (
    <section
      className={`
        mb-6
        rounded-2xl
        border
        p-5

        ${
          isDark
            ? "border-slate-700 bg-slate-800/50"
            : "border-slate-100 bg-slate-50/60"
        }
      `}
    >

      <div className="mb-5 flex items-center gap-3">

        <div
          className={`
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl

            ${
              isDark
                ? "bg-slate-700 text-slate-300"
                : "bg-white text-slate-500 shadow-sm"
            }
          `}
        >
          <Icon
            size={18}
          />
        </div>

        <h3
          className={`font-bold ${
            isDark
              ? "text-white"
              : "text-slate-800"
          }`}
        >
          {title}
        </h3>

      </div>

      <div className="space-y-4">
        {children}
      </div>

    </section>
  );
}

// ======================================================
// LABEL
// ======================================================

function SettingLabel({
  children,
  isDark,
}) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.12em] ${
        isDark
          ? "text-slate-500"
          : "text-slate-400"
      }`}
    >
      {children}
    </p>
  );
}

// ======================================================
// CHOICE CARD
// ======================================================

function ChoiceCard({
  icon: Icon,
  label,
  active,
  isDark,
  accent,
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
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        px-3
        py-3
        text-sm
        font-semibold
        transition

        ${
          active
            ? ""
            : isDark
              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }
      `}
      style={
        active
          ? {
              borderColor:
                accent.primary,

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

      <Icon
        size={17}
      />

      {label}

    </button>
  );
}

// ======================================================
// SEGMENTED CONTROL
// ======================================================

function SegmentedControl({
  value,
  options,
  onChange,
  isDark,
  accent,
}) {
  return (
    <div
      className={`
        flex
        rounded-xl
        border
        p-1

        ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }
      `}
    >

      {options.map(
        (option) => {
          const active =
            value ===
            option.value;

          return (
            <button
              key={
                option.value
              }
              type="button"
              onClick={() =>
                onChange(
                  option.value
                )
              }
              className={`
                flex-1
                rounded-lg
                px-3
                py-2
                text-sm
                font-semibold
                transition

                ${
                  active
                    ? "text-white shadow-sm"
                    : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-800"
                }
              `}
              style={
                active
                  ? {
                      backgroundColor:
                        accent.primary,
                    }
                  : undefined
              }
            >
              {
                option.label
              }
            </button>
          );
        }
      )}

    </div>
  );
}

// ======================================================
// TOGGLE
// ======================================================

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  isDark,
  accent,
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <div>

        <p
          className={`text-sm font-semibold ${
            isDark
              ? "text-slate-200"
              : "text-slate-700"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-1 text-xs leading-5 ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={
          checked
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className="relative h-7 w-12 shrink-0 rounded-full transition"
        style={{
          backgroundColor:
            checked
              ? accent.primary
              : isDark
                ? "#475569"
                : "#cbd5e1",
        }}
      >

        <span
          className={`
            absolute
            top-1
            h-5
            w-5
            rounded-full
            bg-white
            shadow
            transition-all

            ${
              checked
                ? "left-6"
                : "left-1"
            }
          `}
        />

      </button>

    </div>
  );
}

// ======================================================
// NAVIGATION ROW
// ======================================================

function SettingsNavigationRow({
  icon: Icon,
  label,
  description,
  isDark,
  expanded = false,
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
        w-full
        items-center
        gap-3
        rounded-xl
        px-3
        py-3
        text-left
        transition

        ${
          isDark
            ? "hover:bg-slate-700"
            : "hover:bg-white"
        }
      `}
    >

      <Icon
        size={18}
        className={
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }
      />

      <div className="min-w-0 flex-1">

        <p
          className={`text-sm font-semibold ${
            isDark
              ? "text-slate-200"
              : "text-slate-700"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 text-xs ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {description}
        </p>

      </div>

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

export default AppLayout;