/**
 * @file API route for resolving a submitted token or clientId into a safe UI
 * entry while persisting the sensitive credential state server-side.
 */
import crypto from "crypto";
import { log } from "dbc-node-logger";
import {
  attachCredentialTraceId,
  buildConfigurationResponse,
  buildUserResponse,
  getCredentialTraceId,
  getAccessTokenForClient,
  getRequestIp,
  isInternalRequest,
} from "../../../lib/credentialProviders";
import { buildApplicationEntry } from "../../../lib/credentialApplications";
import { upsertCredentialSessionEntry } from "../../../lib/credentialSession";
import { detectCredentialType } from "../../../utils/credentials";

function getType(value) {
  return detectCredentialType(value);
}

function hashSensitiveValue(value) {
  if (!value) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")
    .slice(0, 12);
}

function summarizeError(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || String(error),
    code: error?.code || error?.cause?.code || null,
  };
}

function getCredentialEntryId({ type, token = null, clientId = null }) {
  if (clientId) {
    return `client:${clientId}`;
  }

  if (type === "token" && token) {
    return `token:${token}`;
  }

  if (type === "client" && clientId) {
    return `client:${clientId}`;
  }

  return null;
}

function buildSafeEntry({
  type,
  token = null,
  clientId = null,
  hasClientSecret = false,
  hasRefreshToken = false,
  supportsRefreshToken = false,
  configuration = {},
  user = {},
  profile = null,
  agency = null,
  requiresClientSecret = false,
  status = "OK",
  network = null,
  reasonCode = null,
  message = null,
}) {
  const effectiveClientId = clientId || configuration?.clientId || null;

  return {
    ...buildApplicationEntry(
      getCredentialEntryId({
        type,
        token,
        clientId: effectiveClientId,
      }),
      {
        type,
        token,
        clientId: effectiveClientId,
        clientSecret: hasClientSecret ? "__attached__" : null,
        refreshToken: hasRefreshToken ? "__attached__" : null,
        supportsRefreshToken:
          supportsRefreshToken || Boolean(configuration?.supportsRefreshToken),
        profile: configuration?.profiles?.[0] || profile || null,
        agency: configuration?.agency || agency || null,
        requiresClientSecret,
        status,
        network,
        reasonCode,
        message,
      }
    ),
    configuration,
    user,
  };
}

function toExpiresAt(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function respondWithClientSecretRequired({
  req,
  res,
  clientId,
  entryId,
  network,
  reasonCode,
  traceId,
}) {
  const detectedIp = getRequestIp(req);
  const sessionEntry = await upsertCredentialSessionEntry(
    { req, res },
    entryId || `client:${clientId}`,
    {
      type: "client",
      clientId,
      network,
      requiresClientSecret: true,
      status: "CLIENT_SECRET_REQUIRED",
      reasonCode,
    }
  );

  return res.status(428).send({
    status: "CLIENT_SECRET_REQUIRED",
    entry: sessionEntry,
    network,
    detectedIp,
    safeEntry: buildSafeEntry({
      type: "client",
      clientId,
      hasClientSecret: false,
      requiresClientSecret: true,
      status: "CLIENT_SECRET_REQUIRED",
      network,
      reasonCode,
    }),
    reasonCode,
    traceId,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send({});
  }

  const traceId = attachCredentialTraceId(res, getCredentialTraceId(req));

  const {
    value,
    clientId,
    clientSecret,
    refreshToken,
    tokenType,
    expiresAt,
    expiresIn,
    entryId,
    agency,
  } = req.body || {};

  const normalizedExpiresIn =
    typeof expiresIn === "number"
      ? expiresIn
      : typeof expiresIn === "string" && expiresIn
        ? Number(expiresIn)
        : null;
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const type = getType(normalizedValue);

  if (!type) {
    return res.status(400).send({
      status: "INVALID_INPUT",
      message: "Input must be a token or a clientId",
      traceId,
    });
  }

  try {
    log.info("CREDENTIAL_RESOLVE_START", {
      traceId,
      type,
      network: isInternalRequest(req) ? "internal" : "external",
      tokenHash: type === "token" ? hashSensitiveValue(normalizedValue) : null,
      clientId: type === "client" ? normalizedValue : clientId || null,
      entryId: entryId || null,
      agency: agency || null,
    });

    if (type === "token") {
      const network = isInternalRequest(req) ? "internal" : "external";
      const configurationResponse = await buildConfigurationResponse(
        normalizedValue,
        agency,
        { traceId }
      );
      let userResponse = { status: 200, body: {} };

      try {
        userResponse = await buildUserResponse(normalizedValue, { traceId });
      } catch (error) {
        log.warn("CREDENTIAL_RESOLVE_USER_ENRICHMENT_FAILED", {
          traceId,
          tokenHash: hashSensitiveValue(normalizedValue),
          error: summarizeError(error),
        });
        userResponse = { status: 200, body: {} };
      }
      const resolvedClientId =
        configurationResponse.body?.clientId || clientId || null;
      const resolvedExpiresAt =
        expiresAt ||
        (Number.isFinite(normalizedExpiresIn) && normalizedExpiresIn > 0
          ? Date.now() + normalizedExpiresIn * 1000
          : toExpiresAt(configurationResponse.body?.expires));
      const canonicalType = resolvedClientId ? "client" : "token";
      const canonicalEntryId =
        entryId ||
        getCredentialEntryId({
          type: canonicalType,
          token: normalizedValue,
          clientId: resolvedClientId,
        });

      if (configurationResponse.status !== 200) {
        log.warn("CREDENTIAL_RESOLVE_INVALID_TOKEN", {
          traceId,
          tokenHash: hashSensitiveValue(normalizedValue),
          configurationStatus: configurationResponse.status,
        });
        return res.status(configurationResponse.status).send({
          status: "TOKEN_INVALID",
          message: "Token could not be validated",
          traceId,
        });
      }

      const safeEntry = buildSafeEntry({
        type: canonicalType,
        token: normalizedValue,
        clientId: resolvedClientId,
        hasClientSecret: Boolean(clientSecret),
        hasRefreshToken: Boolean(refreshToken),
        supportsRefreshToken: Boolean(
          configurationResponse.body?.supportsRefreshToken
        ),
        configuration: configurationResponse.body,
        user: userResponse.body || {},
        status: "OK",
        network,
      });

      const sessionEntry = await upsertCredentialSessionEntry(
        { req, res },
        canonicalEntryId,
        {
          type: canonicalType,
          token: normalizedValue,
          clientId: resolvedClientId,
          hasClientSecret: Boolean(clientSecret),
          hasRefreshToken: Boolean(refreshToken),
          supportsRefreshToken: Boolean(
            configurationResponse.body?.supportsRefreshToken
          ),
          clientSecret: clientSecret || null,
          refreshToken: refreshToken || null,
          tokenType: tokenType || "Bearer",
          network,
          expiresAt: resolvedExpiresAt,
          profile: configurationResponse.body?.profiles?.[0] || null,
          agency: configurationResponse.body?.agency || null,
          status: "OK",
        }
      );

      log.info("CREDENTIAL_RESOLVE_SUCCESS", {
        traceId,
        type: canonicalType,
        network,
        tokenHash: hashSensitiveValue(normalizedValue),
        clientId: resolvedClientId,
      });

      return res.status(200).send({
        status: "OK",
        entry: sessionEntry,
        safeEntry,
        traceId,
      });
    }

    const network = isInternalRequest(req) ? "internal" : "external";

    if (!clientSecret) {
      try {
        const tokenResolution = await getAccessTokenForClient({
          clientId: normalizedValue,
          network,
          req,
          traceId,
        });

        if (tokenResolution.status === 200 && tokenResolution.token) {
          const accessToken = tokenResolution.token;
          const safeEntry = buildSafeEntry({
            type: "client",
            token: accessToken,
            clientId: normalizedValue,
            hasClientSecret: false,
            hasRefreshToken: Boolean(tokenResolution.refreshToken),
            supportsRefreshToken: false,
            agency: agency || null,
            requiresClientSecret: false,
            status: "OK",
            network,
          });

          const sessionEntry = await upsertCredentialSessionEntry(
            { req, res },
            entryId || `client:${normalizedValue}`,
            {
              type: "client",
              clientId: normalizedValue,
              hasClientSecret: false,
              hasRefreshToken: Boolean(tokenResolution.refreshToken),
              supportsRefreshToken: false,
              network,
              requiresClientSecret: false,
              token: accessToken,
              refreshToken: tokenResolution.refreshToken || null,
              tokenType: tokenResolution.tokenType || "Bearer",
              expiresAt: tokenResolution.expiresAt || null,
              profile: null,
              agency: agency || null,
              status: "OK",
            }
          );

          return res.status(200).send({
            status: "OK",
            entry: sessionEntry,
            safeEntry,
            traceId,
          });
        }
      } catch (error) {
        log.warn("CREDENTIAL_RESOLVE_AUTO_EXCHANGE_FAILED", {
          traceId,
          clientId: normalizedValue,
          network,
          error: summarizeError(error),
        });
      }

      return await respondWithClientSecretRequired({
        req,
        res,
        clientId: normalizedValue,
        entryId,
        network,
        reasonCode:
          network === "internal"
            ? "CLIENT_SECRET_AUTO_EXCHANGE_FAILED"
            : "CLIENT_SECRET_REQUIRED",
        traceId,
      });
    }

    const tokenResolution = await getAccessTokenForClient({
      clientId: normalizedValue,
      clientSecret,
      network,
      req,
      traceId,
    });

    if (tokenResolution.status !== 200) {
      log.warn("CREDENTIAL_RESOLVE_CLIENT_INVALID", {
        traceId,
        clientId: normalizedValue,
        network,
        tokenStatus: tokenResolution.status,
      });
      return res.status(401).send({
        status: "CLIENT_CREDENTIALS_INVALID",
        message: "Client credentials could not be validated",
        traceId,
      });
    }

    const accessToken = tokenResolution.token;

    if (!accessToken) {
      log.error("CREDENTIAL_RESOLVE_TOKEN_EXCHANGE_FAILED", {
        traceId,
        clientId: normalizedValue,
        network,
      });
      return res.status(500).send({
        status: "TOKEN_EXCHANGE_FAILED",
        message: "Could not exchange client credentials for an access token",
        traceId,
      });
    }

    const safeEntry = buildSafeEntry({
      type: "client",
      token: accessToken,
      clientId: normalizedValue,
      hasClientSecret: true,
      hasRefreshToken: Boolean(tokenResolution.refreshToken),
      supportsRefreshToken: false,
      agency: agency || null,
      requiresClientSecret: false,
      status: "OK",
      network,
    });

    const sessionEntry = await upsertCredentialSessionEntry(
      { req, res },
      entryId || `client:${normalizedValue}`,
      {
        type: "client",
        clientId: normalizedValue,
        hasClientSecret: true,
        hasRefreshToken: Boolean(tokenResolution.refreshToken),
        supportsRefreshToken: false,
        clientSecret,
        network,
        requiresClientSecret: false,
        token: accessToken,
        refreshToken: tokenResolution.refreshToken || null,
        tokenType: tokenResolution.tokenType || "Bearer",
        expiresAt: tokenResolution.expiresAt || null,
        profile: null,
        agency: agency || null,
        status: "OK",
      }
    );

    log.info("CREDENTIAL_RESOLVE_SUCCESS", {
      traceId,
      type: "client",
      network,
      clientId: normalizedValue,
      tokenHash: hashSensitiveValue(accessToken),
    });

    return res.status(200).send({
      status: "OK",
      entry: sessionEntry,
      safeEntry,
      traceId,
    });
  } catch (error) {
    log.error("CREDENTIAL_RESOLVE_FAILED", {
      traceId,
      type,
      tokenHash: type === "token" ? hashSensitiveValue(normalizedValue) : null,
      clientId: type === "client" ? normalizedValue : clientId || null,
      error: summarizeError(error),
    });
    return res.status(500).send({
      status: "RESOLVE_FAILED",
      message: "Credential could not be resolved right now",
      traceId,
    });
  }
}
