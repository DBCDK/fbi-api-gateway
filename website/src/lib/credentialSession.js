/**
 * @file Server-side credential session storage utilities. This module owns the
 * cookie/session identifiers, Redis persistence, and encrypted backup-cookie
 * restore flow for credential entries.
 */
import crypto from "crypto";
import { parseCookies, setCookie, destroyCookie } from "nookies";

import config from "../../../src/config.js";
import {
  get as getRedis,
  set as setRedis,
  del as delRedis,
} from "../../../src/datasources/redis.datasource";
import {
  buildSessionEntriesFromBackupClientIds,
  listBackupClientIds,
  sanitizeCredentialSessionEntry,
} from "./credentialApplications";

const COOKIE_NAME = "fbi_credentials_session";
const BACKUP_COOKIE_NAME = "fbi_credentials_backup";
const MAX_SERVER_ENTRIES = config.credentials?.maxClientEntries || 10;
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
const REDIS_PREFIX = "credential_session";
const SERVER_SIDE_STORAGE_ENABLED =
  config.datasources.redis.enabled === true ||
  config.datasources.redis.enabled === "true";

console.info("[credentials][session] storage mode configured", {
  storageMode: SERVER_SIDE_STORAGE_ENABLED ? "redis" : "cookie",
  redisEnabled: SERVER_SIDE_STORAGE_ENABLED,
  redisHost: config.datasources.redis.host,
  redisPrefix: config.datasources.redis.prefix,
  maxEntries: MAX_SERVER_ENTRIES,
});

function getKey() {
  const secret = process.env.WEBSITE_CREDENTIALS_SECRET || process.env.APP_ID;

  if (!secret) {
    return null;
  }

  return crypto.createHash("sha256").update(secret).digest();
}

function seal(value) {
  const key = getKey();

  if (!key) {
    return null;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function unseal(value) {
  const key = getKey();

  if (!key) {
    return null;
  }

  const [ivValue, tagValue, encryptedValue] = String(value || "").split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    return null;
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

function getEntries(session) {
  return Object.fromEntries(
    Object.entries(session?.entries || {})
      .sort(([, a], [, b]) => (b?.updatedAt || 0) - (a?.updatedAt || 0))
      .slice(0, MAX_SERVER_ENTRIES)
      .map(([entryId, entry]) => [entryId, sanitizeCredentialSessionEntry(entry)])
  );
}

function getBackupClientIds(session) {
  return listBackupClientIds(session?.entries || {}).slice(0, MAX_SERVER_ENTRIES);
}

function normalizeBackupSession(rawBackup = null) {
  if (!rawBackup) {
    return null;
  }

  if (Array.isArray(rawBackup?.clientIds)) {
    return {
      entries: buildSessionEntriesFromBackupClientIds(rawBackup.clientIds),
    };
  }

  if (Array.isArray(rawBackup)) {
    return {
      entries: buildSessionEntriesFromBackupClientIds(rawBackup),
    };
  }

  if (rawBackup?.entries && !Array.isArray(rawBackup.entries)) {
    const clientIds = listBackupClientIds(rawBackup.entries);

    return {
      entries: buildSessionEntriesFromBackupClientIds(clientIds),
    };
  }

  return null;
}

function usesServerSideStorage() {
  return SERVER_SIDE_STORAGE_ENABLED;
}

function createSessionId() {
  return crypto.randomUUID();
}

function getRedisKey(sessionId) {
  return `${REDIS_PREFIX}_${sessionId}`;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK_IN_SECONDS,
  };
}

function setBackupCookie(ctx, session) {
  const clientIds = getBackupClientIds(session);
  const sealedValue = seal({ clientIds });

  if (clientIds.length === 0) {
    console.info("[credentials][session] backup cookie cleared due to empty client list");
    destroyCookie(ctx, BACKUP_COOKIE_NAME, {
      path: "/",
    });
    return;
  }

  if (!sealedValue) {
    console.info(
      "[credentials][session] backup cookie not set because no sealing key is configured",
      {
        hasWebsiteCredentialsSecret: Boolean(
          process.env.WEBSITE_CREDENTIALS_SECRET
        ),
        hasAppId: Boolean(process.env.APP_ID),
        clientIds,
      }
    );
    destroyCookie(ctx, BACKUP_COOKIE_NAME, {
      path: "/",
    });
    return;
  }

  console.info("[credentials][session] backup cookie updated", {
    clientIds,
  });

  setCookie(
    ctx,
    BACKUP_COOKIE_NAME,
    sealedValue,
    getCookieOptions()
  );
}

function getBackupSession(ctx) {
  const cookies = parseCookies(ctx);
  const raw = cookies[BACKUP_COOKIE_NAME];

  if (!raw) {
    console.info("[credentials][session] backup cookie missing");
    return null;
  }

  try {
    const normalizedBackup = normalizeBackupSession(unseal(raw)) || null;

    console.info("[credentials][session] backup cookie loaded", {
      hasBackupSession: Boolean(normalizedBackup),
      entryCount: Object.keys(normalizedBackup?.entries || {}).length,
      entryIds: Object.keys(normalizedBackup?.entries || {}),
    });

    return normalizedBackup;
  } catch {
    console.info("[credentials][session] backup cookie could not be parsed");
    return null;
  }
}

function getSessionId(ctx) {
  const cookies = parseCookies(ctx);
  const value = cookies[COOKIE_NAME] || null;

  if (value?.includes(".")) {
    return null;
  }

  return value;
}

function setSessionIdCookie(ctx, sessionId) {
  setCookie(ctx, COOKIE_NAME, sessionId, getCookieOptions());
}

async function getRedisSession(sessionId) {
  if (!sessionId) {
    return { entries: {} };
  }

  const stored = await getRedis(getRedisKey(sessionId));
  return stored?.val || { entries: {} };
}

async function setRedisSession(sessionId, session) {
  await setRedis(
    getRedisKey(sessionId),
    ONE_WEEK_IN_SECONDS,
    {
      entries: getEntries(session),
    }
  );
}

async function restoreRedisSession(ctx, sessionId = null, session = null) {
  const restoredSession = {
    entries: getEntries(session),
  };

  if (Object.keys(restoredSession.entries).length === 0) {
    console.info("[credentials][session] restore skipped due to empty backup");
    return { sessionId: null, session: { entries: {} } };
  }

  const effectiveSessionId = sessionId || getSessionId(ctx) || createSessionId();
  console.info("[credentials][session] restoring session from backup", {
    previousSessionId: sessionId,
    restoredSessionId: effectiveSessionId,
    entryCount: Object.keys(restoredSession.entries).length,
    entryIds: Object.keys(restoredSession.entries),
  });
  await setRedisSession(effectiveSessionId, restoredSession);
  setSessionIdCookie(ctx, effectiveSessionId);
  setBackupCookie(ctx, restoredSession);

  return {
    sessionId: effectiveSessionId,
    session: restoredSession,
  };
}

export async function getCredentialSession(ctx) {
  const cookies = parseCookies(ctx);
  const raw = cookies[COOKIE_NAME];

  if (usesServerSideStorage()) {
    console.info("[credentials][session] using redis-backed session storage", {
      hasSessionCookie: Boolean(raw),
      hasBackupCookie: Boolean(cookies[BACKUP_COOKIE_NAME]),
      sessionId: raw && !raw.includes(".") ? raw : null,
    });

    if (!raw) {
      console.info(
        "[credentials][session] session cookie missing, attempting backup restore"
      );
      const backupSession = getBackupSession(ctx);
      if (!backupSession) {
        console.info(
          "[credentials][session] no backup available for missing session cookie"
        );
        return { sessionId: null, session: { entries: {} } };
      }

      return await restoreRedisSession(ctx, null, backupSession);
    }

    if (raw.includes(".")) {
      try {
        const legacySession = unseal(raw) || { entries: {} };
        return await restoreRedisSession(ctx, null, legacySession);
      } catch {
        return { sessionId: null, session: { entries: {} } };
      }
    }

    const redisSession = await getRedisSession(raw);

    if (Object.keys(redisSession.entries || {}).length > 0) {
      return {
        sessionId: raw,
        session: redisSession,
      };
    }

    const backupSession = getBackupSession(ctx);

    if (!backupSession) {
      console.info(
        "[credentials][session] redis session empty and no backup available"
      );
      return { sessionId: null, session: { entries: {} } };
    }

    console.info(
      "[credentials][session] redis session empty, attempting backup restore"
    );
    return await restoreRedisSession(ctx, raw, backupSession);
  }

  if (!raw) {
    return { sessionId: null, session: { entries: {} } };
  }

  try {
    return {
      sessionId: null,
      session: unseal(raw) || { entries: {} },
    };
  } catch {
    return { sessionId: null, session: { entries: {} } };
  }
}

export async function setCredentialSession(ctx, session, sessionId = null) {
  const normalizedSession = {
    entries: getEntries(session),
  };

  if (usesServerSideStorage()) {
    const effectiveSessionId = sessionId || getSessionId(ctx) || createSessionId();
    console.info("[credentials][session] persisting session to redis", {
      sessionId: effectiveSessionId,
      entryCount: Object.keys(normalizedSession.entries || {}).length,
    });
    await setRedisSession(effectiveSessionId, normalizedSession);
    setSessionIdCookie(ctx, effectiveSessionId);
    setBackupCookie(ctx, normalizedSession);
    return effectiveSessionId;
  }

  const sealedValue = seal(normalizedSession);

  if (!sealedValue) {
    destroyCookie(ctx, COOKIE_NAME, {
      path: "/",
    });
    return null;
  }

  setCookie(ctx, COOKIE_NAME, sealedValue, getCookieOptions());
  return null;
}

export async function clearCredentialSession(ctx) {
  if (usesServerSideStorage()) {
    const sessionId = getSessionId(ctx);
    if (sessionId) {
      await delRedis(getRedisKey(sessionId));
    }
  }

  destroyCookie(ctx, COOKIE_NAME, {
    path: "/",
  });

  destroyCookie(ctx, BACKUP_COOKIE_NAME, {
    path: "/",
  });
}

export async function upsertCredentialSessionEntry(ctx, entryId, nextEntry) {
  const { sessionId, session } = await getCredentialSession(ctx);
  const entries = {
    ...(session.entries || {}),
    [entryId]: {
      ...(session.entries?.[entryId] || {}),
      ...nextEntry,
      updatedAt: Date.now(),
    },
  };

  await setCredentialSession(ctx, { entries }, sessionId);
  return entries[entryId];
}

export async function getCredentialSessionEntry(ctx, entryId) {
  const { sessionId, session } = await getCredentialSession(ctx);
  const entry = session.entries?.[entryId] || null;

  if (!entry) {
    console.info("[credentials][session] entry lookup miss", {
      entryId,
      sessionId,
      entryCount: Object.keys(session.entries || {}).length,
      availableEntryIds: Object.keys(session.entries || {}),
    });
  }

  return entry;
}

export async function removeCredentialSessionEntry(ctx, entryId) {
  const { sessionId, session } = await getCredentialSession(ctx);

  if (!session.entries?.[entryId]) {
    return;
  }

  const entries = { ...session.entries };
  delete entries[entryId];
  await setCredentialSession(ctx, { entries }, sessionId);
}
