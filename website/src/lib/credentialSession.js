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
  dedupeCredentialEntries,
  listBackupClientIds,
  sanitizeCredentialSessionEntry,
} from "./credentialApplications";

const COOKIE_NAME = "fbi_credentials_session";
const BACKUP_COOKIE_NAME = "fbi_credentials_backup";
const MAX_SERVER_ENTRIES = config.credentials?.maxClientEntries || 10;
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_YEAR_IN_SECONDS = ONE_DAY_IN_SECONDS * 365;
const SESSION_REFRESH_INTERVAL_IN_MS = ONE_DAY_IN_SECONDS * 1000;
const REDIS_PREFIX = "credential_session";
const SERVER_SIDE_STORAGE_ENABLED =
  config.datasources.redis.enabled === true ||
  config.datasources.redis.enabled === "true";

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
    Object.values(dedupeCredentialEntries(session?.entries || {}))
      .sort(
        ({ entry: left }, { entry: right }) =>
          (right?.updatedAt || 0) - (left?.updatedAt || 0)
      )
      .slice(0, MAX_SERVER_ENTRIES)
      .map(({ entryId, entry }) => [entryId, sanitizeCredentialSessionEntry(entry)])
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

function getRequestProtocol(ctx) {
  const forwardedProto = ctx?.req?.headers?.["x-forwarded-proto"];
  const forwardedHeader = ctx?.req?.headers?.forwarded;
  const forwardedProtoValue = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  const forwardedHeaderMatch =
    typeof forwardedHeader === "string"
      ? forwardedHeader.match(/proto=([^;,\s]+)/i)
      : null;

  if (typeof forwardedProtoValue === "string" && forwardedProtoValue.trim()) {
    return forwardedProtoValue.split(",")[0].trim().toLowerCase();
  }

  if (forwardedHeaderMatch?.[1]) {
    return forwardedHeaderMatch[1].trim().toLowerCase();
  }

  if (ctx?.req?.socket?.encrypted || ctx?.req?.connection?.encrypted) {
    return "https";
  }

  return null;
}

export function shouldUseSecureCookies(ctx) {
  const protocol = getRequestProtocol(ctx);

  if (protocol === "https") {
    return true;
  }

  if (protocol === "http") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function getCookieOptions(ctx) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(ctx),
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  };
}

function getSerializableSession(session) {
  return {
    entries: getEntries(session),
    touchedAt: Number(session?.touchedAt || 0) || Date.now(),
  };
}

function shouldRefreshSession(session) {
  const touchedAt = Number(session?.touchedAt || 0);

  if (!touchedAt) {
    return true;
  }

  return Date.now() - touchedAt >= SESSION_REFRESH_INTERVAL_IN_MS;
}

function getCookieContext(ctx) {
  if (ctx?.res) {
    return ctx;
  }

  if (ctx?.req?.res) {
    return {
      ...ctx,
      res: ctx.req.res,
    };
  }

  return null;
}

function setBackupCookie(ctx, session) {
  const clientIds = getBackupClientIds(session);
  const sealedValue = seal({ clientIds });

  if (clientIds.length === 0) {
    destroyCookie(ctx, BACKUP_COOKIE_NAME, {
      path: "/",
    });
    return;
  }

  if (!sealedValue) {
    destroyCookie(ctx, BACKUP_COOKIE_NAME, {
      path: "/",
    });
    return;
  }

  setCookie(
    ctx,
    BACKUP_COOKIE_NAME,
    sealedValue,
    getCookieOptions(ctx)
  );
}

function getBackupSession(ctx) {
  const cookies = parseCookies(ctx);
  const raw = cookies[BACKUP_COOKIE_NAME];

  if (!raw) {
    return null;
  }

  try {
    return normalizeBackupSession(unseal(raw)) || null;
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
  setCookie(ctx, COOKIE_NAME, sessionId, getCookieOptions(ctx));
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
    ONE_YEAR_IN_SECONDS,
    getSerializableSession(session)
  );
}

async function restoreRedisSession(ctx, sessionId = null, session = null) {
  const restoredSession = getSerializableSession(session);

  if (Object.keys(restoredSession.entries).length === 0) {
    return { sessionId: null, session: { entries: {}, touchedAt: 0 } };
  }

  const effectiveSessionId = sessionId || getSessionId(ctx) || createSessionId();
  await setRedisSession(effectiveSessionId, restoredSession);
  const cookieContext = getCookieContext(ctx);
  if (cookieContext) {
    setSessionIdCookie(cookieContext, effectiveSessionId);
    setBackupCookie(cookieContext, restoredSession);
  }

  return {
    sessionId: effectiveSessionId,
    session: restoredSession,
  };
}

async function refreshSessionIfNeeded(ctx, sessionId, session) {
  const cookieContext = getCookieContext(ctx);

  if (!cookieContext || !sessionId || !shouldRefreshSession(session)) {
    return session;
  }

  const refreshedSession = {
    ...session,
    touchedAt: Date.now(),
  };

  await setRedisSession(sessionId, refreshedSession);
  setSessionIdCookie(cookieContext, sessionId);
  setBackupCookie(cookieContext, refreshedSession);

  return refreshedSession;
}

export async function getCredentialSession(ctx) {
  const cookies = parseCookies(ctx);
  const raw = cookies[COOKIE_NAME];

  if (usesServerSideStorage()) {
    if (!raw) {
      const backupSession = getBackupSession(ctx);
      if (!backupSession) {
        return { sessionId: null, session: { entries: {}, touchedAt: 0 } };
      }

      return await restoreRedisSession(ctx, null, backupSession);
    }

    if (raw.includes(".")) {
      try {
        const legacySession = unseal(raw) || { entries: {} };
        return await restoreRedisSession(ctx, null, legacySession);
      } catch {
        return { sessionId: null, session: { entries: {}, touchedAt: 0 } };
      }
    }

    const redisSession = await getRedisSession(raw);

    if (Object.keys(redisSession.entries || {}).length > 0) {
      const refreshedSession = await refreshSessionIfNeeded(
        ctx,
        raw,
        redisSession
      );

      return {
        sessionId: raw,
        session: refreshedSession,
      };
    }

    const backupSession = getBackupSession(ctx);

    if (!backupSession) {
      return { sessionId: null, session: { entries: {}, touchedAt: 0 } };
    }

    return await restoreRedisSession(ctx, raw, backupSession);
  }

  if (!raw) {
    return { sessionId: null, session: { entries: {}, touchedAt: 0 } };
  }

  try {
    const session = getSerializableSession(unseal(raw) || { entries: {} });
    const cookieContext = getCookieContext(ctx);

    if (cookieContext && shouldRefreshSession(session)) {
      const refreshedSession = {
        ...session,
        touchedAt: Date.now(),
      };
      const sealedValue = seal(refreshedSession);

      if (sealedValue) {
        setCookie(
          cookieContext,
          COOKIE_NAME,
          sealedValue,
          getCookieOptions(cookieContext)
        );
      }

      return {
        sessionId: null,
        session: refreshedSession,
      };
    }

    return {
      sessionId: null,
      session,
    };
  } catch {
    return { sessionId: null, session: { entries: {}, touchedAt: 0 } };
  }
}

export async function setCredentialSession(ctx, session, sessionId = null) {
  const normalizedSession = {
    ...getSerializableSession(session),
    touchedAt: Date.now(),
  };

  if (usesServerSideStorage()) {
    const effectiveSessionId = sessionId || getSessionId(ctx) || createSessionId();
    await setRedisSession(effectiveSessionId, normalizedSession);
    const cookieContext = getCookieContext(ctx);
    if (cookieContext) {
      setSessionIdCookie(cookieContext, effectiveSessionId);
      setBackupCookie(cookieContext, normalizedSession);
    }
    return effectiveSessionId;
  }

  const sealedValue = seal(normalizedSession);

  if (!sealedValue) {
    destroyCookie(getCookieContext(ctx) || ctx, COOKIE_NAME, {
      path: "/",
    });
    return null;
  }

  const cookieContext = getCookieContext(ctx) || ctx;
  setCookie(
    cookieContext,
    COOKIE_NAME,
    sealedValue,
    getCookieOptions(cookieContext)
  );
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
  const { session } = await getCredentialSession(ctx);
  const entry = session.entries?.[entryId] || null;

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
