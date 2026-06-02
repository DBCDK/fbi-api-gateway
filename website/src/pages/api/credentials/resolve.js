/**
 * @file API route for resolving a submitted token or clientId into a safe UI
 * entry while persisting the sensitive credential state server-side.
 */
import {
  buildConfigurationResponse,
  buildUserResponse,
  getAccessTokenForClient,
  getRequestIp,
  isInternalRequest,
} from "../../../lib/credentialProviders";
import { upsertCredentialSessionEntry } from "../../../lib/credentialSession";
import { detectCredentialType } from "../../../utils/credentials";
import config from "../../../../../src/config.js";

function getType(value) {
  return detectCredentialType(value);
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
  requiresClientSecret = false,
  status = "OK",
  network = null,
  reasonCode = null,
  message = null,
}) {
  return {
    id: `${type}:${type === "token" ? token : clientId}`,
    type,
    token,
    clientId: clientId || configuration?.clientId || null,
    hasClientSecret,
    hasRefreshToken,
    supportsRefreshToken:
      supportsRefreshToken || Boolean(configuration?.supportsRefreshToken),
    profile: configuration?.profiles?.[0] || null,
    agency: configuration?.agency || null,
    note: "",
    timestamp: Date.now(),
    requiresClientSecret,
    status,
    network,
    reasonCode,
    message,
    configuration,
    user,
  };
}

function maskValue(value, visible = 6) {
  if (!value || typeof value !== "string") {
    return value || null;
  }

  if (value.length <= visible * 2) {
    return `${value.slice(0, visible)}...`;
  }

  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function logCredentialDebug(step, details = {}) {
  const timestamp = new Date().toISOString();
  console.info(`\n[credentials][resolve][${timestamp}] ${step}`);
  console.info(details);
}

async function respondWithClientSecretRequired({
  req,
  res,
  clientId,
  entryId,
  network,
  reasonCode,
}) {
  const detectedIp = getRequestIp(req);
  logCredentialDebug("CLIENT_SECRET_REQUIRED", {
    clientId,
    entryId: entryId || `client:${clientId}`,
    network,
    detectedIp,
    reasonCode,
  });
  const sessionEntry = await upsertCredentialSessionEntry(
    { req, res },
    entryId || `client:${clientId}`,
    {
      type: "client",
      clientId,
      network,
      requiresClientSecret: true,
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
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send({});
  }

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

  logCredentialDebug("REQUEST_RECEIVED", {
    type,
    entryId,
    agency,
    clientId,
    hasClientSecret: Boolean(clientSecret),
    hasRefreshToken: Boolean(refreshToken),
    tokenType: tokenType || null,
    expiresAt: expiresAt || null,
    expiresIn: normalizedExpiresIn,
    valuePreview: maskValue(normalizedValue),
    detectedIp: getRequestIp(req),
    disableInternalNetworkCheck:
      config.credentials?.disableInternalNetworkCheck || false,
  });

  if (!type) {
    logCredentialDebug("INVALID_INPUT", {
      valuePreview: maskValue(normalizedValue),
    });
    return res.status(400).send({
      status: "INVALID_INPUT",
      message: "Input must be a token or a clientId",
    });
  }

  try {
    if (type === "token") {
      const configurationResponse = await buildConfigurationResponse(
        normalizedValue,
        agency
      );
      const userResponse = await buildUserResponse(normalizedValue);

      logCredentialDebug("TOKEN_VALIDATED", {
        tokenPreview: maskValue(normalizedValue),
        configurationStatus: configurationResponse.status,
        userStatus: userResponse.status,
        resolvedClientId:
          configurationResponse.body?.clientId || clientId || null,
      });

      if (configurationResponse.status !== 200) {
        return res.status(configurationResponse.status).send({
          status: "TOKEN_INVALID",
          message: "Token could not be validated",
        });
      }

      const safeEntry = buildSafeEntry({
        type: "token",
        token: normalizedValue,
        hasClientSecret: Boolean(clientSecret),
        hasRefreshToken: Boolean(refreshToken),
        supportsRefreshToken: Boolean(
          configurationResponse.body?.supportsRefreshToken
        ),
        configuration: configurationResponse.body,
        user: userResponse.body || {},
        status: "OK",
      });

      const sessionEntry = await upsertCredentialSessionEntry(
        { req, res },
        entryId || `token:${normalizedValue}`,
        {
          type: "token",
          token: normalizedValue,
          clientId: clientId || configurationResponse.body.clientId,
          hasClientSecret: Boolean(clientSecret),
          hasRefreshToken: Boolean(refreshToken),
          supportsRefreshToken: Boolean(
            configurationResponse.body?.supportsRefreshToken
          ),
          clientSecret: clientSecret || null,
          refreshToken: refreshToken || null,
          tokenType: tokenType || "Bearer",
          expiresAt:
            expiresAt ||
            (Number.isFinite(normalizedExpiresIn) && normalizedExpiresIn > 0
              ? Date.now() + normalizedExpiresIn * 1000
              : null),
        }
      );

      return res.status(200).send({
        status: "OK",
        entry: sessionEntry,
        safeEntry,
      });
    }

    const network = isInternalRequest(req) ? "internal" : "external";
    logCredentialDebug("CLIENT_NETWORK_DETECTED", {
      clientId: normalizedValue,
      network,
      detectedIp: getRequestIp(req),
      hasClientSecret: Boolean(clientSecret),
      disableInternalNetworkCheck:
        config.credentials?.disableInternalNetworkCheck || false,
    });

    if (!clientSecret) {
      try {
        const tokenResolution = await getAccessTokenForClient({
          clientId: normalizedValue,
          network,
          req,
        });

        logCredentialDebug("CLIENT_TOKEN_ATTEMPT_WITHOUT_SECRET", {
          clientId: normalizedValue,
          network,
          status: tokenResolution.status,
          grantTypeUsed: tokenResolution.grantTypeUsed || null,
          tokenPreview: maskValue(tokenResolution.token),
          expiresAt: tokenResolution.expiresAt || null,
          hasRefreshToken: Boolean(tokenResolution.refreshToken),
        });

        if (tokenResolution.status === 200 && tokenResolution.token) {
          const accessToken = tokenResolution.token;
          const configurationResponse = await buildConfigurationResponse(
            accessToken,
            agency
          );
          const userResponse = await buildUserResponse(accessToken);

          logCredentialDebug("CLIENT_TOKEN_VALIDATED_WITHOUT_SECRET", {
            clientId: normalizedValue,
            tokenPreview: maskValue(accessToken),
            configurationStatus: configurationResponse.status,
            userStatus: userResponse.status,
          });

          if (configurationResponse.status !== 200) {
            return res.status(configurationResponse.status).send({
              status: "TOKEN_INVALID",
              message: "Client token could not be validated",
            });
          }

          const safeEntry = buildSafeEntry({
            type: "client",
            token: accessToken,
            clientId: normalizedValue,
            hasClientSecret: false,
            hasRefreshToken: Boolean(tokenResolution.refreshToken),
            supportsRefreshToken: Boolean(
              configurationResponse.body?.supportsRefreshToken
            ),
            configuration: configurationResponse.body,
            user: userResponse.body || {},
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
              supportsRefreshToken: Boolean(
                configurationResponse.body?.supportsRefreshToken
              ),
              network,
              requiresClientSecret: false,
              token: accessToken,
              refreshToken: tokenResolution.refreshToken || null,
              tokenType: tokenResolution.tokenType || "Bearer",
              expiresAt: tokenResolution.expiresAt || null,
            }
          );

          return res.status(200).send({
            status: "OK",
            entry: sessionEntry,
            safeEntry,
          });
        }
      } catch (error) {
        logCredentialDebug("CLIENT_TOKEN_ATTEMPT_FAILED", {
          clientId: normalizedValue,
          network,
          error: error?.message || "Unknown error",
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
      });
    }

    const tokenResolution = await getAccessTokenForClient({
      clientId: normalizedValue,
      clientSecret,
      network,
      req,
    });

    logCredentialDebug("CLIENT_TOKEN_ATTEMPT_WITH_SECRET", {
      clientId: normalizedValue,
      network,
      status: tokenResolution.status,
      grantTypeUsed: tokenResolution.grantTypeUsed || null,
      tokenPreview: maskValue(tokenResolution.token),
      expiresAt: tokenResolution.expiresAt || null,
      hasRefreshToken: Boolean(tokenResolution.refreshToken),
    });

    if (tokenResolution.status !== 200) {
      return res.status(401).send({
        status: "CLIENT_CREDENTIALS_INVALID",
        message: "Client credentials could not be validated",
      });
    }

    const accessToken = tokenResolution.token;

    if (!accessToken) {
      return res.status(500).send({
        status: "TOKEN_EXCHANGE_FAILED",
        message: "Could not exchange client credentials for an access token",
      });
    }

    const configurationResponse = await buildConfigurationResponse(
      accessToken,
      agency
    );
    const userResponse = await buildUserResponse(accessToken);

    logCredentialDebug("CLIENT_TOKEN_VALIDATED_WITH_SECRET", {
      clientId: normalizedValue,
      tokenPreview: maskValue(accessToken),
      configurationStatus: configurationResponse.status,
      userStatus: userResponse.status,
    });

    if (configurationResponse.status !== 200) {
      return res.status(configurationResponse.status).send({
        status: "TOKEN_INVALID",
        message: "Resolved client token could not be validated",
      });
    }

    const safeEntry = buildSafeEntry({
      type: "client",
      token: accessToken,
      clientId: normalizedValue,
      hasClientSecret: true,
      hasRefreshToken: Boolean(tokenResolution.refreshToken),
      supportsRefreshToken: Boolean(configurationResponse.body?.supportsRefreshToken),
      configuration: configurationResponse.body,
      user: userResponse.body || {},
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
        supportsRefreshToken: Boolean(configurationResponse.body?.supportsRefreshToken),
        clientSecret,
        network,
        requiresClientSecret: false,
        token: accessToken,
        refreshToken: tokenResolution.refreshToken || null,
        tokenType: tokenResolution.tokenType || "Bearer",
        expiresAt: tokenResolution.expiresAt || null,
      }
    );

    return res.status(200).send({
      status: "OK",
      entry: sessionEntry,
      safeEntry,
    });
  } catch (error) {
    logCredentialDebug("RESOLVE_FAILED", {
      type,
      valuePreview: maskValue(normalizedValue),
      error: error?.message || "Unknown error",
      stack: error?.stack || null,
    });
    return res.status(500).send({
      status: "RESOLVE_FAILED",
      message: "Credential could not be resolved right now",
    });
  }
}
