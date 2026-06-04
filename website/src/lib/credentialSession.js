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

const COOKIE_NAME = "fbi_credentials_session";
const BACKUP_COOKIE_NAME = "fbi_credentials_backup";
const MAX_SERVER_ENTRIES = config.credentials?.maxClientEntries || 10;
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
const REDIS_PREFIX = "credential_session";

function getKey() {
  const secret =
    process.env.WEBSITE_CREDENTIALS_SECRET ||
    process.env.APP_ID ||
    "fbi-api-gateway-dev-secret";

  return crypto.createHash("sha256").update(secret).digest();
}

function seal(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function unseal(value) {
  const [ivValue, tagValue, encryptedValue] = String(value || "").split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    return null;
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

function sanitizeSessionEntry(entry = {}) {
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
    updatedAt: entry.updatedAt || Date.now(),
  };
}

function getEntries(session) {
  return Object.fromEntries(
    Object.entries(session?.entries || {})
      .sort(([, a], [, b]) => (b?.updatedAt || 0) - (a?.updatedAt || 0))
      .slice(0, MAX_SERVER_ENTRIES)
      .map(([entryId, entry]) => [entryId, sanitizeSessionEntry(entry)])
  );
}

function getBackupEntries(session) {
  return Object.fromEntries(
    Object.entries(session?.entries || {})
      .filter(([, entry]) => entry?.clientId && entry?.clientSecret)
      .sort(([, a], [, b]) => (b?.updatedAt || 0) - (a?.updatedAt || 0))
      .slice(0, MAX_SERVER_ENTRIES)
      .map(([entryId, entry]) => [
        entryId,
        {
          type: entry.type || "client",
          clientId: entry.clientId,
          clientSecret: entry.clientSecret || null,
          network: entry.network || null,
          requiresClientSecret: Boolean(entry.requiresClientSecret),
          updatedAt: entry.updatedAt || Date.now(),
        },
      ])
  );
}

function usesServerSideStorage() {
  return (
    config.datasources.redis.enabled === true ||
    config.datasources.redis.enabled === "true"
  );
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
  const backupEntries = getBackupEntries(session);

  if (Object.keys(backupEntries).length === 0) {
    destroyCookie(ctx, BACKUP_COOKIE_NAME, {
      path: "/",
    });
    return;
  }

  setCookie(
    ctx,
    BACKUP_COOKIE_NAME,
    seal({ entries: backupEntries }),
    getCookieOptions()
  );
}

function getBackupSession(ctx) {
  const cookies = parseCookies(ctx);
  const raw = cookies[BACKUP_COOKIE_NAME];

  if (!raw) {
    return null;
  }

  try {
    return unseal(raw) || null;
  } catch {
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
    return { sessionId: null, session: { entries: {} } };
  }

  const effectiveSessionId = sessionId || getSessionId(ctx) || createSessionId();
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
    if (!raw) {
      const backupSession = getBackupSession(ctx);
      if (!backupSession) {
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
      return { sessionId: null, session: { entries: {} } };
    }

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
    await setRedisSession(effectiveSessionId, normalizedSession);
    setSessionIdCookie(ctx, effectiveSessionId);
    setBackupCookie(ctx, normalizedSession);
    return effectiveSessionId;
  }

  setCookie(ctx, COOKIE_NAME, seal(normalizedSession), getCookieOptions());
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
