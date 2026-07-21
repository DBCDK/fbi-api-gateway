const DEFAULT_MAX_CLIENT_ENTRIES = 5;

function parseMaxClientEntries(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_CLIENT_ENTRIES;
}

export function getMaxClientEntries() {
  return parseMaxClientEntries(process.env.NEXT_PUBLIC_MAX_CLIENT_ENTRIES);
}

export const MAX_CLIENT_ENTRIES = getMaxClientEntries();
