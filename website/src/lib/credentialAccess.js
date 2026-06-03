/**
 * @file Central access-token lifecycle helper for credential entries,
 * including reuse, refresh-token exchange, and client credential fallback.
 */
import {
  getAccessTokenForClient,
  refreshAccessToken,
  isInternalRequest,
} from "./credentialProviders";
import { upsertCredentialSessionEntry } from "./credentialSession";

const EXPIRY_BUFFER_MS = 15 * 1000;

function isTokenStillValid(entry) {
  if (!entry?.token) {
    return false;
  }

  if (!entry.expiresAt) {
    return true;
  }

  return entry.expiresAt - Date.now() > EXPIRY_BUFFER_MS;
}

async function persistTokenState(
  ctx,
  entryId,
  entry,
  tokenState,
  network = entry?.network || null
) {
  const nextEntry = await upsertCredentialSessionEntry(ctx, entryId, {
    ...entry,
    token: tokenState.token,
    refreshToken: tokenState.refreshToken || null,
    tokenType: tokenState.tokenType || entry?.tokenType || "Bearer",
    expiresAt: tokenState.expiresAt || null,
    requiresClientSecret: false,
    network,
  });

  return nextEntry;
}

export async function resolveCredentialAccessToken({
  ctx,
  entryId,
  entry,
  req,
  skipTokenReuse = false,
}) {
  if (!entry) {
    return { status: 404, entry: null, token: null };
  }

  console.info("[credentials][access] resolve start", {
    entryId,
    type: entry?.type || null,
    clientId: entry?.clientId || null,
    hasToken: Boolean(entry?.token),
    hasRefreshToken: Boolean(entry?.refreshToken),
    hasClientSecret: Boolean(entry?.clientSecret),
    expiresAt: entry?.expiresAt || null,
    skipTokenReuse,
  });

  if (!skipTokenReuse && isTokenStillValid(entry)) {
    console.info("[credentials][access] reusing stored token", {
      entryId,
      clientId: entry?.clientId || null,
      expiresAt: entry?.expiresAt || null,
    });
    return {
      status: 200,
      entry,
      token: entry.token,
    };
  }

  if (entry.refreshToken && entry.clientId && entry.clientSecret) {
    const refreshedTokenState = await refreshAccessToken({
      clientId: entry.clientId,
      clientSecret: entry.clientSecret,
      refreshToken: entry.refreshToken,
    });

    console.info("[credentials][access] refresh token attempt", {
      entryId,
      clientId: entry.clientId,
      status: refreshedTokenState.status,
      hasToken: Boolean(refreshedTokenState.token),
      expiresAt: refreshedTokenState.expiresAt || null,
    });

    if (refreshedTokenState.status === 200 && refreshedTokenState.token) {
      const nextEntry = await persistTokenState(
        ctx,
        entryId,
        entry,
        refreshedTokenState
      );

      return {
        status: 200,
        entry: nextEntry,
        token: refreshedTokenState.token,
      };
    }
  }

  if (!entry.clientId) {
    return {
      status: entry.requiresClientSecret ? 428 : 401,
      entry,
      token: null,
    };
  }

  const resolvedNetwork = req
    ? isInternalRequest(req)
      ? "internal"
      : "external"
    : entry.network || null;
  const preferredNetwork = entry.clientSecret ? entry.network || null : null;

  const tokenState = await getAccessTokenForClient({
    clientId: entry.clientId,
    clientSecret: entry.clientSecret || null,
    network: preferredNetwork,
    req,
  });

  console.info("[credentials][access] client token attempt", {
    entryId,
    clientId: entry.clientId,
    preferredNetwork,
    resolvedNetwork,
    status: tokenState.status,
    grantTypeUsed: tokenState.grantTypeUsed || null,
    hasToken: Boolean(tokenState.token),
    expiresAt: tokenState.expiresAt || null,
    clientSecretUsed: tokenState.clientSecretUsed ?? null,
  });

  if (tokenState.status !== 200 || !tokenState.token) {
    return {
      status: tokenState.status === 428 ? 428 : 401,
      entry,
      token: null,
    };
  }

  const nextEntry = await persistTokenState(
    ctx,
    entryId,
    entry,
    tokenState,
    resolvedNetwork
  );

  return {
    status: 200,
    entry: nextEntry,
    token: tokenState.token,
  };
}
