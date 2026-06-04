import getConfig from "next/config";

const DEFAULT_MAX_CLIENT_ENTRIES = 5;

function parseMaxClientEntries(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_CLIENT_ENTRIES;
}

export function getMaxClientEntries() {
  const runtimeConfig = getConfig?.()?.publicRuntimeConfig || {};

  // The website should follow the server-exposed runtime config instead of
  // maintaining its own independent fallback rules in the browser.
  return parseMaxClientEntries(runtimeConfig.maxClientEntries);
}

export const MAX_CLIENT_ENTRIES = getMaxClientEntries();
