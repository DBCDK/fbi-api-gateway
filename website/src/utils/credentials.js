/**
 * @file Shared client-side credential format detection utilities for deciding
 * whether user input should be treated as a token, a clientId, or invalid.
 */
import { isToken } from "@/components/utils";

const CLIENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const EASTER_EGG_CREDENTIAL = "🥳";
export const EASTER_EGG_CREDENTIAL_ID = "easteregg:resolve-runner";
export const EASTER_EGG_DISPLAY_NAME = "Resolve Runner";

function normalizeProfileValue(profile) {
  if (typeof profile === "string") {
    return profile;
  }

  if (profile && typeof profile?.name === "string") {
    return profile.name;
  }

  return null;
}

export function isClientId(value) {
  return (
    typeof value === "string" &&
    CLIENT_ID_PATTERN.test(value.trim()) &&
    !isToken(value)
  );
}

export function detectCredentialType(value) {
  if (typeof value === "string" && value.trim() === EASTER_EGG_CREDENTIAL) {
    return "easteregg";
  }

  if (isToken(value)) {
    return "token";
  }

  if (isClientId(value)) {
    return "client";
  }

  return null;
}

export function toCredentialId({ type, token, clientId }) {
  if (type === "easteregg") {
    return EASTER_EGG_CREDENTIAL_ID;
  }

  if (type === "token" && token) {
    return `token:${token}`;
  }

  if (type === "client" && clientId) {
    return `client:${clientId}`;
  }

  return null;
}

export function normalizeCredentialEntry(input, current = {}) {
  if (!input) {
    return null;
  }

  const entry = typeof input === "string" ? { value: input } : input;
  const rawValue = entry.value || entry.token || entry.clientId || "";
  const type = entry.type || detectCredentialType(rawValue);

  if (!type) {
    return null;
  }

  const token =
    type === "token" || type === "easteregg"
      ? rawValue
      : entry.token || current.token || null;
  const clientId =
    type === "client" ? rawValue : entry.clientId || current.clientId || null;
  const id = entry.id || toCredentialId({ type, token, clientId });

  if (!id) {
    return null;
  }

  return {
    id,
    type,
    token,
    clientId,
    profile:
      entry.profile === undefined
        ? normalizeProfileValue(current.profile)
        : normalizeProfileValue(entry.profile),
    agency: entry.agency === undefined ? current.agency ?? null : entry.agency,
    note: entry.note === undefined ? current.note ?? "" : entry.note,
    timestamp: entry.timestamp || current.timestamp || Date.now(),
    network: entry.network || current.network || null,
    requiresClientSecret:
      entry.requiresClientSecret === undefined
        ? current.requiresClientSecret ?? false
        : entry.requiresClientSecret,
  };
}
