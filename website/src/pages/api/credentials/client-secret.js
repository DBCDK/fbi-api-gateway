/**
 * @file API route for attaching a real clientSecret to an existing credential
 * entry without requiring a fresh token exchange up front.
 */
import {
  buildConfigurationResponse,
  buildUserResponse,
} from "../../../lib/credentialProviders";
import {
  getCredentialSessionEntry,
  upsertCredentialSessionEntry,
} from "../../../lib/credentialSession";

function buildSafeEntry({ entry, configuration = {}, user = {} }) {
  return {
    id: entry.id,
    type: entry.type || "client",
    token: entry.token || null,
    clientId: entry.clientId || configuration?.clientId || null,
    hasClientSecret: Boolean(entry.clientSecret),
    hasRefreshToken: Boolean(entry.refreshToken),
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
  const clientSecret =
    typeof req.body?.clientSecret === "string"
      ? req.body.clientSecret.trim()
      : "";
  const selectedAgency =
    typeof req.body?.agency === "string" && req.body.agency
      ? req.body.agency
      : null;

  if (!entryId || !clientSecret) {
    return res.status(400).send({
      status: "INVALID_CLIENT_SECRET_INPUT",
      message: "ClientSecret input is required",
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

  const nextEntry = await upsertCredentialSessionEntry(
    { req, res },
    entryId,
    {
      ...sessionEntry,
      clientSecret,
      hasClientSecret: true,
      requiresClientSecret: false,
    }
  );

  const entry = {
    ...nextEntry,
    id: entryId,
  };

  let configuration = {};
  let user = {};

  if (entry.token) {
    const configurationResponse = await buildConfigurationResponse(
      entry.token,
      selectedAgency
    );
    const userResponse = await buildUserResponse(entry.token);

    if (configurationResponse.status === 200) {
      configuration = configurationResponse.body || {};
    }

    if (userResponse.status === 200) {
      user = userResponse.body || {};
    }
  }

  return res.status(200).send({
    status: "OK",
    entry,
    safeEntry: buildSafeEntry({
      entry,
      configuration,
      user,
    }),
  });
}
