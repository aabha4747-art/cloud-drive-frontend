// src/utils/driveDragData.js

export const DRIVE_DRAG_MIME =
  "application/x-cloud-drive-items";

export const DRIVE_DRAG_SOURCE =
  "cloud-drive";

export function createDriveDragPayload(items = []) {
  return {
    source: DRIVE_DRAG_SOURCE,

    items: items.map((entry) => ({
      resourceType: entry.resourceType,

      id:
        entry.item?.id ??
        entry.id,

      item:
        entry.item ??
        entry,
    })),
  };
}

export function writeDriveDragPayload(
  dataTransfer,
  items
) {
  if (!dataTransfer) {
    return;
  }

  const payload =
    createDriveDragPayload(items);

  dataTransfer.effectAllowed = "move";

  dataTransfer.setData(
    DRIVE_DRAG_MIME,
    JSON.stringify(payload)
  );

  // Fallback data.
  dataTransfer.setData(
    "text/plain",
    JSON.stringify(payload)
  );
}

export function readDriveDragPayload(
  dataTransfer
) {
  if (!dataTransfer) {
    return null;
  }

  const raw =
    dataTransfer.getData(
      DRIVE_DRAG_MIME
    );

  if (!raw) {
    return null;
  }

  try {
    const payload =
      JSON.parse(raw);

    if (
      payload?.source !== DRIVE_DRAG_SOURCE ||
      !Array.isArray(payload?.items)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hasDriveDragPayload(
  dataTransfer
) {
  if (!dataTransfer) {
    return false;
  }

  return Array.from(
    dataTransfer.types || []
  ).includes(DRIVE_DRAG_MIME);
}

export function hasExternalFiles(
  dataTransfer
) {
  if (!dataTransfer) {
    return false;
  }

  return Array.from(
    dataTransfer.types || []
  ).includes("Files");
}