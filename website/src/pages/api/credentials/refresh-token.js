/**
 * @file API route for attaching a refresh token to an existing credential
 * entry, validating it immediately, and persisting the refreshed token state
 * server-side.
 */
import {
  buildConfigurationResponse,
  buildUserResponse,
  getInternalClientSecretForDate,
  isInternalRequest,
  refreshAccessToken,
} from "../../../lib/credentialProviders";
import {
  getCredentialSessionEntry,
  upsertCredentialSessionEntry,
} from "../../../lib/credentialSession";

function buildSafeEntry({
  entry,
  configuration = {},
  user = {},
  token,
  refreshToken,
}) {
  return {
    id: entry.id,
    type: entry.type || "client",
    token,
    clientId: entry.clientId || configuration?.clientId || null,
    hasClientSecret: Boolean(entry.clientSecret),
    hasRefreshToken: Boolean(refreshToken),
    supportsRefreshToken: Boolean(configuration?.supportsRefreshToken),
    profile: configuration?.profiles?.[0] || null,
    agency: configuration?.agency || null,
    note: "",
    timestamp: Date.now(),
    requiresClientSecret: Boolean(entry.requiresClientSecret),
    status: "OK",
    network: entry.network || null,
    reasonCode: null,
    message: null,
    configuration,
    user,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send({});
  }

  const entryId =
    typeof req.body?.entryId === "string" ? req.body.entryId : null;
  const refreshToken =
    typeof req.body?.refreshToken === "string"
      ? req.body.refreshToken.trim()
      : "";
  const selectedAgency =
    typeof req.body?.agency === "string" && req.body.agency
      ? req.body.agency
      : null;

  if (!entryId || !refreshToken) {
    return res.status(400).send({
      status: "INVALID_REFRESH_TOKEN_INPUT",
      message: "Refresh token input is required",
    });
  }

  const sessionEntry = await getCredentialSessionEntry({ req, res }, entryId);

  if (!sessionEntry) {
    return res.status(404).send({
      status: "CREDENTIAL_ENTRY_NOT_FOUND",
      message: "Credential entry could not be found",
    });
  }

  const effectiveClientSecret =
    sessionEntry.clientSecret ||
    (isInternalRequest(req) ? getInternalClientSecretForDate() : null);

  if (!sessionEntry.clientId || !effectiveClientSecret) {
    return res.status(428).send({
      status: "CLIENT_SECRET_REQUIRED",
      message: "Attach a clientSecret before adding a refresh token",
    });
  }

  const tokenState = await refreshAccessToken({
    clientId: sessionEntry.clientId,
    clientSecret: effectiveClientSecret,
    refreshToken,
  });

  if (tokenState.status !== 200 || !tokenState.token) {
    return res.status(401).send({
      status: "REFRESH_TOKEN_INVALID",
      message: "Refresh token could not be validated",
    });
  }

  const configurationResponse = await buildConfigurationResponse(
    tokenState.token,
    selectedAgency
  );
  const userResponse = await buildUserResponse(tokenState.token);

  if (configurationResponse.status !== 200) {
    return res.status(configurationResponse.status).send({
      status: "TOKEN_INVALID",
      message: "Resolved refresh token access token could not be validated",
    });
  }

  const nextEntry = await upsertCredentialSessionEntry(
    { req, res },
    entryId,
    {
      ...sessionEntry,
      token: tokenState.token,
      refreshToken: tokenState.refreshToken || refreshToken,
      tokenType: tokenState.tokenType || sessionEntry.tokenType || "Bearer",
      expiresAt: tokenState.expiresAt || null,
      hasRefreshToken: true,
      supportsRefreshToken: Boolean(
        configurationResponse.body?.supportsRefreshToken
      ),
      requiresClientSecret: false,
    }
  );

  const entry = {
    ...nextEntry,
    id: entryId,
  };

  return res.status(200).send({
    status: "OK",
    entry,
    safeEntry: buildSafeEntry({
      entry,
      configuration: configurationResponse.body,
      user: userResponse.body || {},
      token: tokenState.token,
      refreshToken: tokenState.refreshToken || refreshToken,
    }),
  });
}
