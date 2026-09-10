/**
 * @file API route for returning Smaug configuration for either a raw token or
 * a server-side credential session entry that can provide a valid token.
 */
import { resolveCredentialAccessToken } from "../../../lib/credentialAccess";
import {
  buildConfigurationResponse,
  isInternalRequest,
} from "../../../lib/credentialProviders";
import { getCredentialSessionEntry } from "../../../lib/credentialSession";

function getEntryId(req) {
  return typeof req.query.entryId === "string" ? req.query.entryId : null;
}

export function buildResolvedConfigurationPayload({
  req,
  resolved,
  configurationResponse,
}) {
  const canAutoRefresh =
    resolved.entry?.type === "client" &&
    (Boolean(resolved.entry?.clientSecret) ||
      Boolean(resolved.entry?.refreshToken) ||
      isInternalRequest(req));

  return {
    ...(configurationResponse.body || {}),
    resolvedToken: resolved.token,
    resolvedEntryId: resolved.entry?.id || getEntryId(req),
    resolvedClientId:
      resolved.entry?.clientId || configurationResponse.body?.clientId || null,
    resolvedType: resolved.entry?.type || null,
    resolvedHasClientSecret: Boolean(
      resolved.entry?.hasClientSecret || resolved.entry?.clientSecret
    ),
    resolvedHasRefreshToken: Boolean(
      resolved.entry?.hasRefreshToken || resolved.entry?.refreshToken
    ),
    resolvedSupportsRefreshToken: Boolean(
      configurationResponse.body?.supportsRefreshToken
    ),
    resolvedExpiresAt: resolved.entry?.expiresAt || null,
    resolvedCanAutoRefresh: canAutoRefresh,
  };
}

async function resolveAccessToken(req) {
  const token = typeof req.query.token === "string" ? req.query.token : null;

  if (token) {
    return { token, status: 200 };
  }

  const entryId = getEntryId(req);

  if (!entryId) {
    return { status: 400 };
  }

  const sessionEntry = await getCredentialSessionEntry({ req }, entryId);

  if (!sessionEntry) {
    return { status: 404 };
  }

  return await resolveCredentialAccessToken({
    ctx: { req, res: req.res },
    entryId,
    entry: sessionEntry,
    req,
  });
}

async function retryExpiredCredentialEntry({
  req,
  resolved,
  selectedAgency,
}) {
  if (!resolved?.entry?.clientId || !resolved?.entry?.id) {
    return null;
  }

  const refreshed = await resolveCredentialAccessToken({
    ctx: { req, res: req.res },
    entryId: resolved.entry.id,
    entry: resolved.entry,
    req,
    skipTokenReuse: true,
  });

  if (refreshed.status !== 200 || !refreshed.token) {
    return {
      resolved: refreshed,
      configurationResponse: null,
    };
  }

  const configurationResponse = await buildConfigurationResponse(
    refreshed.token,
    selectedAgency
  );

  return {
    resolved: refreshed,
    configurationResponse,
  };
}
export default async function handler(req, res) {
  const selectedAgency =
    typeof req.query.agency === "string" && req.query.agency
      ? req.query.agency
      : null;

  const resolved = await resolveAccessToken(req);

  if (resolved.status === 428) {
    return res.status(428).send({
      status: "CLIENT_SECRET_REQUIRED",
      network: resolved.entry?.network || null,
      clientId: resolved.entry?.clientId || null,
    });
  }

  if (resolved.status !== 200 || !resolved.token) {
    return res.status(resolved.status || 500).send({});
  }

  const configurationResponse = await buildConfigurationResponse(
    resolved.token,
    selectedAgency
  );

  if (configurationResponse.status !== 200) {
    const retried = await retryExpiredCredentialEntry({
      req,
      resolved,
      selectedAgency,
    });

    if (retried?.resolved?.status === 428) {
      return res.status(428).send({
        status: "CLIENT_SECRET_REQUIRED",
        network: retried.resolved.entry?.network || null,
        clientId: retried.resolved.entry?.clientId || null,
      });
    }

    if (retried?.configurationResponse?.status === 200) {
      return res.status(200).send(
        buildResolvedConfigurationPayload({
          req,
          resolved: retried.resolved,
          configurationResponse: retried.configurationResponse,
        })
      );
    }

    return res
      .status(
        retried?.configurationResponse?.status ||
          retried?.resolved?.status ||
          configurationResponse.status
      )
      .send({});
  }

  return res
    .status(200)
    .send(
      buildResolvedConfigurationPayload({
        req,
        resolved,
        configurationResponse,
      })
    );
}
