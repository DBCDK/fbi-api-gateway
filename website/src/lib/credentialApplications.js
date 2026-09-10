import { toCredentialId } from "../utils/credentials";

export function sanitizeCredentialSessionEntry(entry = {}) {
  return {
    type: entry.type || "client",
    token: entry.token || null,
    clientId: entry.clientId || null,
    clientSecret: entry.clientSecret || null,
    refreshToken: entry.refreshToken || null,
    tokenType: entry.tokenType || null,
    expiresAt: entry.expiresAt || null,
    network: entry.network || null,
    requiresClientSecret: Boolean(entry.requiresClientSecret),
    supportsRefreshToken: Boolean(entry.supportsRefreshToken),
    note: entry.note || "",
    profile: entry.profile || null,
    agency: entry.agency || null,
    status: entry.status || "OK",
    reasonCode: entry.reasonCode || null,
    message: entry.message || null,
    updatedAt: entry.updatedAt || Date.now(),
  };
}

function getCredentialIdentity(entryId, entry = {}) {
  if (typeof entry?.clientId === "string" && entry.clientId) {
    return `client:${entry.clientId}`;
  }

  if (typeof entryId === "string" && entryId) {
    return entryId;
  }

  if (entry?.type === "token" && entry?.token) {
    return `token:${entry.token}`;
  }

  return null;
}

function getCredentialPriority(entry = {}) {
  return [
    Boolean(entry?.clientSecret) ? 1 : 0,
    Boolean(entry?.refreshToken) ? 1 : 0,
    entry?.type === "client" ? 1 : 0,
    Boolean(entry?.token) ? 1 : 0,
    Number(entry?.updatedAt || 0),
  ];
}

function shouldPreferEntry(nextEntry = {}, currentEntry = {}) {
  const nextPriority = getCredentialPriority(nextEntry);
  const currentPriority = getCredentialPriority(currentEntry);

  for (let index = 0; index < nextPriority.length; index += 1) {
    if (nextPriority[index] === currentPriority[index]) {
      continue;
    }

    return nextPriority[index] > currentPriority[index];
  }

  return false;
}

export function dedupeCredentialEntries(entries = {}) {
  return Object.entries(entries).reduce((acc, [entryId, rawEntry]) => {
    const entry = sanitizeCredentialSessionEntry(rawEntry);
    const identity = getCredentialIdentity(entryId, entry);

    if (!identity) {
      return acc;
    }

    const current = acc[identity];

    if (!current || shouldPreferEntry(entry, current.entry)) {
      acc[identity] = {
        entryId,
        entry,
      };
    }

    return acc;
  }, {});
}

export function listBackupClientIds(entries = {}) {
  return Object.values(
    dedupeCredentialEntries(entries)
  )
    .map(({ entry }) => entry)
    .filter((entry) => typeof entry?.clientId === "string" && entry.clientId)
    .sort((left, right) => (right?.updatedAt || 0) - (left?.updatedAt || 0))
    .map((entry) => entry.clientId)
    .filter((clientId, index, values) => values.indexOf(clientId) === index);
}

export function buildSessionEntriesFromBackupClientIds(clientIds = []) {
  return clientIds.reduce((acc, clientId, index) => {
    if (typeof clientId !== "string" || !clientId) {
      return acc;
    }

    const entryId = toCredentialId({
      type: "client",
      token: null,
      clientId,
    });

    if (!entryId) {
      return acc;
    }

    acc[entryId] = sanitizeCredentialSessionEntry({
      type: "client",
      clientId,
      updatedAt: Date.now() - index,
    });

    return acc;
  }, {});
}

export function buildApplicationEntry(entryId, entry = {}) {
  const normalized = sanitizeCredentialSessionEntry(entry);

  return {
    id:
      entryId ||
      toCredentialId({
        type: normalized.type,
        token: normalized.token,
        clientId: normalized.clientId,
      }),
    type: normalized.type,
    token: normalized.token,
    clientId: normalized.clientId,
    hasClientSecret: Boolean(normalized.clientSecret),
    hasRefreshToken: Boolean(normalized.refreshToken),
    supportsRefreshToken: Boolean(normalized.supportsRefreshToken),
    profile: normalized.profile,
    agency: normalized.agency,
    note: normalized.note,
    timestamp: normalized.updatedAt,
    requiresClientSecret: normalized.requiresClientSecret,
    status: normalized.status,
    network: normalized.network,
    reasonCode: normalized.reasonCode,
    message: normalized.message,
    expiresAt: normalized.expiresAt,
  };
}

export function listApplicationEntries(entries = {}) {
  return Object.values(dedupeCredentialEntries(entries))
    .sort(
      ({ entry: left }, { entry: right }) =>
        (right?.updatedAt || 0) - (left?.updatedAt || 0)
    )
    .map(({ entryId, entry }) => buildApplicationEntry(entryId, entry))
    .filter((entry) => Boolean(entry?.id));
}
