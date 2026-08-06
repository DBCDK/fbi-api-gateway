/**
 * @file This file contains utility functions for handling patron-related operations.
 */

import { GraphQLError } from "graphql";

export function badUserInput(message) {
  return new GraphQLError(
    message,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { code: "BAD_USER_INPUT" }
  );
}

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

const namespacedMaterialIdPattern = /^[^\s:]+:[^\s]+$/;

export function isPid(materialId) {
  return (
    typeof materialId === "string" &&
    !materialId.startsWith("work-of:") &&
    namespacedMaterialIdPattern.test(materialId)
  );
}

export function isWorkId(materialId) {
  return (
    typeof materialId === "string" &&
    materialId.startsWith("work-of:") &&
    isPid(materialId.slice("work-of:".length))
  );
}

export function isFaustNumber(materialId) {
  return typeof materialId === "string" && /^\d+$/.test(materialId);
}

export function isBookmarkMaterialId(materialId) {
  return isWorkId(materialId) || isPid(materialId);
}

export function isHistoricalLoanMaterialId(materialId) {
  return isFaustNumber(materialId) || isPid(materialId);
}
