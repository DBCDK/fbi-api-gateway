/**
 * @file This file contains utility functions for handling patron-related operations.
 */

// Helper function to determine overall status based on item statuses.
export function getOverallStatus(items = [], successStatuses = ["OK"]) {
  if (items.length === 0) return "OK";

  const successStatusSet = new Set(successStatuses);
  const hasSuccess = items.some((item) => successStatusSet.has(item.status));
  const hasFailure = items.some((item) => !successStatusSet.has(item.status));

  if (hasSuccess && hasFailure) {
    return "PARTIALLY_FAILED";
  }

  if (hasFailure) {
    return "FAILED";
  }

  return "OK";
}

// helper for normalizing legacy bookmark IDs
export function normalizeBookmarkId(id) {
  if (id === null || typeof id === "undefined") {
    return null;
  }

  return String(id);
}

// Helper for parsing legacy bookmark ids
export function parseLegacyBookmarkId(id) {
  if (typeof id !== "string" || !/^\d+$/.test(id)) {
    return null;
  }

  const parsedId = Number.parseInt(id, 10);

  if (Number.isNaN(parsedId)) {
    return null;
  }

  return parsedId;
}
