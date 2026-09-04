/**
 * @file API route for returning user/introspection data for either a raw token
 * or a server-side credential session entry with token lifecycle support.
 */
import crypto from "crypto";
import { log } from "dbc-node-logger";

import { resolveCredentialAccessToken } from "../../../lib/credentialAccess";
import { buildUserResponse } from "../../../lib/credentialProviders";
import { getCredentialSessionEntry } from "../../../lib/credentialSession";

const SLOW_REQUEST_THRESHOLDS_MS = [10000, 60000];

function getRequestId(req) {
  const header = req.headers?.["x-request-id"];
  const value = Array.isArray(header) ? header[0] : header;

  return typeof value === "string" && value
    ? value.slice(0, 128)
    : crypto.randomUUID();
}

function hashEntryId(entryId) {
  if (!entryId) {
    return null;
  }

  return crypto.createHash("sha256").update(entryId).digest("hex").slice(0, 16);
}

async function resolveAccessToken(req, onStageChange) {
  const token = typeof req.query.token === "string" ? req.query.token : null;

  if (token) {
    onStageChange("raw_token_reuse");
    return { token, status: 200 };
  }

  const entryId =
    typeof req.query.entryId === "string" ? req.query.entryId : null;

  if (!entryId) {
    return { status: 400 };
  }

  onStageChange("session_lookup");
  const sessionEntry = await getCredentialSessionEntry({ req }, entryId);

  if (!sessionEntry) {
    return { status: 404 };
  }

  onStageChange("token_resolution");
  return await resolveCredentialAccessToken({
    ctx: { req, res: req.res },
    entryId,
    entry: sessionEntry,
    req,
  });
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const entryId =
    typeof req.query.entryId === "string" ? req.query.entryId : null;
  const requestId = getRequestId(req);
  const logContext = {
    component: "credential_user",
    event: "credential_user_request",
    requestId,
    entryIdHash: hashEntryId(entryId),
    pod: process.env.HOSTNAME || null,
  };
  let stage = "request_received";
  let responseStatus = null;
  let authenticationState = "unknown";
  let outcome = "pending";
  const onStageChange = (nextStage) => {
    stage = nextStage;
  };
  const slowRequestTimers = SLOW_REQUEST_THRESHOLDS_MS.map((thresholdMs) => {
    const timer = setTimeout(() => {
      log.warn("credential_user_request_slow", {
        ...logContext,
        event: "credential_user_request_slow",
        stage,
        elapsedMs: Date.now() - startedAt,
        thresholdMs,
      });
    }, thresholdMs);

    timer.unref?.();
    return timer;
  });
  const handleResponseClose = () => {
    if (res.writableEnded) {
      return;
    }

    log.warn("credential_user_response_closed", {
      ...logContext,
      event: "credential_user_response_closed",
      stage,
      elapsedMs: Date.now() - startedAt,
    });
  };

  res.once("close", handleResponseClose);

  try {
    const resolved = await resolveAccessToken(req, onStageChange);

    if (resolved.status === 428) {
      responseStatus = 428;
      outcome = "client_secret_required";
      return res.status(428).send({
        status: "CLIENT_SECRET_REQUIRED",
        user: {},
      });
    }

    if (resolved.status !== 200 || !resolved.token) {
      responseStatus = resolved.status || 500;
      outcome = "token_resolution_failed";
      return res.status(responseStatus).send({});
    }

    const userResponse = await buildUserResponse(resolved.token, {
      onStageChange,
    });

    if (userResponse.status !== 200) {
      responseStatus = userResponse.status || 500;
      outcome = "user_response_failed";
      return res.status(responseStatus).send({});
    }

    authenticationState =
      userResponse.body?.isAuthenticated === true
        ? "authenticated"
        : userResponse.body?.isAuthenticated === false
          ? "anonymous"
          : "unknown";
    responseStatus = 200;
    outcome = "success";
    onStageChange("send_response");

    return res.status(200).send({
      user: userResponse.body || {},
    });
  } catch (error) {
    outcome = "exception";
    log.error("credential_user_request_failed", {
      ...logContext,
      event: "credential_user_request_failed",
      stage,
      elapsedMs: Date.now() - startedAt,
      errorName: error?.name || "Error",
      errorCode: error?.code || null,
    });
    throw error;
  } finally {
    slowRequestTimers.forEach((timer) => clearTimeout(timer));
    res.off?.("close", handleResponseClose);

    log.info("credential_user_request_completed", {
      ...logContext,
      event: "credential_user_request_completed",
      stage,
      elapsedMs: Date.now() - startedAt,
      responseStatus: responseStatus || res.statusCode || null,
      authenticationState,
      outcome,
      responseFinished: Boolean(res.writableEnded),
    });
  }
}
