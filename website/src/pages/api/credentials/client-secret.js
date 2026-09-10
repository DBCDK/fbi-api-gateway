/**
 * @file API route for attaching a real clientSecret to an existing credential
 * entry without requiring a fresh token exchange up front.
 */
import { getAccessTokenForClient } from "../../../lib/credentialProviders";
import { buildApplicationEntry } from "../../../lib/credentialApplications";
import {
  getCredentialSessionEntry,
  upsertCredentialSessionEntry,
} from "../../../lib/credentialSession";

function buildSafeEntry({ entry, configuration = {}, user = {} }) {
  return {
    ...buildApplicationEntry(entry.id, {
      ...entry,
      clientId: entry.clientId || configuration?.clientId || null,
      supportsRefreshToken:
        typeof configuration?.supportsRefreshToken === "boolean"
          ? configuration.supportsRefreshToken
          : Boolean(entry.supportsRefreshToken),
      profile: configuration?.profiles?.[0] || entry.profile || null,
      agency: configuration?.agency || entry.agency || null,
      status: "OK",
      reasonCode: null,
      message: null,
    }),
    configuration,
    user,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).send({});
  }

  const entryId =
    typeof req.body?.entryId === "string" ? req.body.entryId : null;
  const selectedAgency =
    typeof req.body?.agency === "string" && req.body.agency
      ? req.body.agency
      : null;

  if (!entryId) {
    return res.status(400).send({
      status: "INVALID_CLIENT_SECRET_INPUT",
      message: "Credential entry input is required",
    });
  }

  const sessionEntry = await getCredentialSessionEntry({ req, res }, entryId);

  if (!sessionEntry) {
    return res.status(404).send({
      status: "CREDENTIAL_ENTRY_NOT_FOUND",
      message: "Credential entry could not be found",
    });
  }

  if (!sessionEntry.clientId) {
    return res.status(400).send({
      status: "CLIENT_ID_REQUIRED",
      message: "Credential entry is missing a clientId",
    });
  }

  if (req.method === "DELETE") {
    const nextEntry = await upsertCredentialSessionEntry({ req, res }, entryId, {
      ...sessionEntry,
      clientSecret: null,
      refreshToken: null,
      requiresClientSecret: false,
      status: "OK",
    });

    const entry = {
      ...nextEntry,
      id: entryId,
    };

    return res.status(200).send({
      status: "OK",
      entry,
      safeEntry: buildSafeEntry({
        entry,
      }),
    });
  }

  const clientSecret =
    typeof req.body?.clientSecret === "string"
      ? req.body.clientSecret.trim()
      : "";

  if (!clientSecret) {
    return res.status(400).send({
      status: "INVALID_CLIENT_SECRET_INPUT",
      message: "Client secret input is required",
    });
  }

  const network = sessionEntry.network || null;
  const tokenResolution = await getAccessTokenForClient({
    clientId: sessionEntry.clientId,
    clientSecret,
    network,
    req,
  });

  if (tokenResolution.status !== 200 || !tokenResolution.token) {
    return res.status(401).send({
      status: "CLIENT_CREDENTIALS_INVALID",
      message: "Secret could not be validated",
    });
  }

  const shouldPreserveExistingToken = Boolean(sessionEntry.token);
  const nextToken = shouldPreserveExistingToken
    ? sessionEntry.token
    : tokenResolution.token;
  const nextRefreshToken = shouldPreserveExistingToken
    ? sessionEntry.refreshToken || null
    : tokenResolution.refreshToken || null;
  const nextTokenType = shouldPreserveExistingToken
    ? sessionEntry.tokenType || "Bearer"
    : tokenResolution.tokenType || sessionEntry.tokenType || "Bearer";
  const nextExpiresAt = shouldPreserveExistingToken
    ? sessionEntry.expiresAt || null
    : tokenResolution.expiresAt || null;
  const nextEntry = await upsertCredentialSessionEntry({ req, res }, entryId, {
    ...sessionEntry,
    token: nextToken,
    refreshToken: nextRefreshToken,
    tokenType: nextTokenType,
    expiresAt: nextExpiresAt,
    clientSecret,
    requiresClientSecret: false,
    profile: sessionEntry.profile || null,
    agency: selectedAgency || sessionEntry.agency || null,
    status: "OK",
  });

  const entry = {
    ...nextEntry,
    id: entryId,
  };

  return res.status(200).send({
    status: "OK",
    entry,
    safeEntry: buildSafeEntry({
      entry,
    }),
  });
}
