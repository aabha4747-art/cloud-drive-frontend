// src/components/DriveDropOverlay.jsx

import {
  FolderInput,
  Loader2,
  UploadCloud,
} from "lucide-react";

function DriveDropOverlay({
  isDark,
  visible,
  processing = false,
  mode = "upload",
  title,
  description,
}) {
  if (
    !visible &&
    !processing
  ) {
    return null;
  }

  const isMove =
    mode === "move";

  return (
    <div
      className="
        pointer-events-none
        absolute
        inset-0
        z-[85]
        flex
        items-center
        justify-center
        rounded-3xl
        p-5
      "
    >
      {/* BACKGROUND */}

      <div
        className={`
          absolute
          inset-0
          rounded-3xl
          border-2
          border-dashed
          backdrop-blur-[2px]

          ${
            isDark
              ? `
                border-violet-400
                bg-slate-950/75
              `
              : `
                border-violet-500
                bg-violet-50/90
              `
          }
        `}
      />

      {/* MESSAGE */}

      <div
        className={`
          relative
          flex
          max-w-md
          flex-col
          items-center
          rounded-3xl
          border
          px-8
          py-7
          text-center
          shadow-2xl

          ${
            isDark
              ? `
                border-violet-500/30
                bg-slate-900
                text-slate-100
              `
              : `
                border-violet-200
                bg-white
                text-slate-900
              `
          }
        `}
      >
        {/* ICON */}

        <div
          className={`
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl

            ${
              isDark
                ? `
                  bg-violet-500/15
                  text-violet-300
                `
                : `
                  bg-violet-50
                  text-violet-600
                `
            }
          `}
        >
          {processing ? (
            <Loader2
              size={30}
              className="animate-spin"
            />
          ) : isMove ? (
            <FolderInput
              size={30}
            />
          ) : (
            <UploadCloud
              size={30}
            />
          )}
        </div>

        {/* TITLE */}

        <h3 className="mt-4 text-lg font-bold">
          {processing
            ? "Processing drop..."
            : title ||
              (
                isMove
                  ? "Drop to move here"
                  : "Drop to upload here"
              )}
        </h3>

        {/* DESCRIPTION */}

        {!processing && (
          <p
            className={`
              mt-2
              text-sm
              leading-6

              ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }
            `}
          >
            {description ||
              (
                isMove
                  ? "The selected Cloud Drive items will be moved to this location."
                  : "Files and folders from your computer will be uploaded to this location."
              )}
          </p>
        )}
      </div>
    </div>
  );
}

export default DriveDropOverlay;