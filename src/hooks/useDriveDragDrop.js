import {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  hasDriveDragPayload,
  hasExternalFiles,
  readDriveDragPayload,
} from "../utils/driveDragData";

// ======================================================
// READ EVERY ENTRY FROM A DIRECTORY
// ======================================================

async function readAllDirectoryEntries(
  directoryReader
) {
  const entries = [];

  while (true) {
    const batch =
      await new Promise(
        (resolve, reject) => {
          directoryReader.readEntries(
            resolve,
            reject
          );
        }
      );

    if (!batch.length) {
      break;
    }

    entries.push(...batch);
  }

  return entries;
}

// ======================================================
// GET FILE FROM FILE-SYSTEM ENTRY
// ======================================================

async function fileFromEntry(
  entry
) {
  return new Promise(
    (resolve, reject) => {
      entry.file(
        resolve,
        reject
      );
    }
  );
}

// ======================================================
// RECURSIVELY WALK DROPPED FILE/FOLDER
// ======================================================

async function walkEntry(
  entry,
  parentPath = ""
) {
  if (!entry) {
    return [];
  }

  const path =
    parentPath
      ? `${parentPath}/${entry.name}`
      : entry.name;

  if (entry.isFile) {
    const file =
      await fileFromEntry(
        entry
      );

    return [
      {
        file,
        relativePath:
          path,
      },
    ];
  }

  if (entry.isDirectory) {
    const reader =
      entry.createReader();

    const children =
      await readAllDirectoryEntries(
        reader
      );

    const nested =
      await Promise.all(
        children.map(
          (child) =>
            walkEntry(
              child,
              path
            )
        )
      );

    return nested.flat();
  }

  return [];
}

// ======================================================
// EXTRACT FILES/FOLDERS FROM COMPUTER DROP
// ======================================================

export async function extractExternalFiles(
  dataTransfer
) {
  const items =
    Array.from(
      dataTransfer?.items ||
        []
    );

  const entries =
    items
      .map(
        (item) =>
          item.webkitGetAsEntry?.()
      )
      .filter(Boolean);

  if (entries.length) {
    const nested =
      await Promise.all(
        entries.map(
          (entry) =>
            walkEntry(entry)
        )
      );

    return nested.flat();
  }

  // Fallback for browsers that only expose FileList.

  return Array.from(
    dataTransfer?.files ||
      []
  ).map((file) => ({
    file,

    relativePath:
      file.webkitRelativePath ||
      file.name,
  }));
}

// ======================================================
// DRIVE DRAG/DROP HOOK
// ======================================================

export default function useDriveDragDrop({
  disabled = false,
  onExternalDrop,
  onInternalDrop,
}) {
  const dragDepthRef =
    useRef(0);

  const [
    isExternalDragActive,
    setIsExternalDragActive,
  ] = useState(false);

  const [
    isInternalDragActive,
    setIsInternalDragActive,
  ] = useState(false);

  const [
    isProcessingDrop,
    setIsProcessingDrop,
  ] = useState(false);

  // ======================================================
  // RESET
  // ======================================================

  const resetDragState =
    useCallback(() => {
      dragDepthRef.current = 0;

      setIsExternalDragActive(
        false
      );

      setIsInternalDragActive(
        false
      );
    }, []);

  // ======================================================
  // DRAG ENTER
  // ======================================================

  const onDragEnter =
    useCallback(
      (event) => {
        if (disabled) {
          return;
        }

        const external =
          hasExternalFiles(
            event.dataTransfer
          );

        const internal =
          hasDriveDragPayload(
            event.dataTransfer
          );

        if (
          !external &&
          !internal
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        dragDepthRef.current +=
          1;

        if (external) {
          setIsExternalDragActive(
            true
          );
        }

        if (internal) {
          setIsInternalDragActive(
            true
          );
        }
      },
      [disabled]
    );

  // ======================================================
  // DRAG OVER
  // ======================================================

  const onDragOver =
    useCallback(
      (event) => {
        if (disabled) {
          return;
        }

        const external =
          hasExternalFiles(
            event.dataTransfer
          );

        const internal =
          hasDriveDragPayload(
            event.dataTransfer
          );

        if (
          !external &&
          !internal
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        event.dataTransfer.dropEffect =
          internal
            ? "move"
            : "copy";
      },
      [disabled]
    );

  // ======================================================
  // DRAG LEAVE
  // ======================================================

  const onDragLeave =
    useCallback(
      (event) => {
        if (disabled) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        dragDepthRef.current =
          Math.max(
            0,
            dragDepthRef.current -
              1
          );

        if (
          dragDepthRef.current ===
          0
        ) {
          resetDragState();
        }
      },
      [
        disabled,
        resetDragState,
      ]
    );

  // ======================================================
  // DROP
  // ======================================================

  const onDrop =
    useCallback(
      async (event) => {
        if (disabled) {
          return;
        }

        const external =
          hasExternalFiles(
            event.dataTransfer
          );

        const internalPayload =
          readDriveDragPayload(
            event.dataTransfer
          );

        if (
          !external &&
          !internalPayload
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        resetDragState();

        try {
          setIsProcessingDrop(
            true
          );

          // ----------------------------------------------
          // INTERNAL CLOUD DRIVE ITEM
          // ----------------------------------------------

          if (
            internalPayload &&
            onInternalDrop
          ) {
            await onInternalDrop(
              internalPayload.items,
              event
            );

            return;
          }

          // ----------------------------------------------
          // FILE/FOLDER FROM COMPUTER
          // ----------------------------------------------

          if (
            external &&
            onExternalDrop
          ) {
            const droppedItems =
              await extractExternalFiles(
                event.dataTransfer
              );

            if (
              droppedItems.length >
              0
            ) {
              await onExternalDrop(
                droppedItems,
                event
              );
            }
          }
        } finally {
          setIsProcessingDrop(
            false
          );
        }
      },
      [
        disabled,
        onExternalDrop,
        onInternalDrop,
        resetDragState,
      ]
    );

  return {
    dropZoneProps: {
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
    },

    isExternalDragActive,
    isInternalDragActive,
    isProcessingDrop,

    resetDragState,
  };
}