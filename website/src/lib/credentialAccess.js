/**
 * @file Central access-token lifecycle helper for credential entries,
 * including reuse, refresh-token exchange, and client credential fallback.
 */
import {
  getAccessTokenForClient,
  refreshAccessToken,
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

async function persistTokenState(ctx, entryId, entry, tokenState) {
  const nextEntry = await upsertCredentialSessionEntry(ctx, entryId, {
    ...entry,
    token: tokenState.token,
    refreshToken: tokenState.refreshToken || null,
    tokenType: tokenState.tokenType || entry?.tokenType || "Bearer",
    expiresAt: tokenState.expiresAt || null,
    requiresClientSecret: false,
  });

  return nextEntry;
}

export async function resolveCredentialAccessToken({
  ctx,
  entryId,
  entry,
  req,
}) {
  if (!entry) {
    return { status: 404, entry: null, token: null };
  }

  if (isTokenStillValid(entry)) {
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

  if (entry.requiresClientSecret && !entry.clientSecret) {
    return {
      status: 428,
      entry,
      token: null,
    };
  }

  if (!entry.clientId) {
    return {
      status: entry.requiresClientSecret ? 428 : 401,
      entry,
      token: null,
    };
  }

  const tokenState = await getAccessTokenForClient({
    clientId: entry.clientId,
    clientSecret: entry.clientSecret || null,
    network: entry.network || null,
    req,
  });

  if (tokenState.status !== 200 || !tokenState.token) {
    return {
      status:
        tokenState.status === 428 || entry.requiresClientSecret ? 428 : 401,
      entry,
      token: null,
    };
  }

  const nextEntry = await persistTokenState(ctx, entryId, entry, tokenState);

  return {
    status: 200,
    entry: nextEntry,
    token: tokenState.token,
  };
}
