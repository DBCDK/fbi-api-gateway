/**
 * @file Client-side hook for resolving a user-entered token or clientId
 * through the credential API and returning the normalized server response.
 */
import { useCallback } from "react";
import fetch from "isomorphic-unfetch";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";

export default function useCredentialResolve() {
  function maskValue(value, visible = 6) {
    if (!value || typeof value !== "string") {
      return value || null;
    }

    if (value.length <= visible * 2) {
      return `${value.slice(0, visible)}...`;
    }

    return `${value.slice(0, visible)}...${value.slice(-visible)}`;
  }

  function getFallbackMessage(rawBody, statusText) {
    const normalized = String(rawBody || "").trim();

    if (!normalized) {
      return statusText || "Request failed";
    }

    if (normalized.startsWith("<")) {
      return statusText || "Server returned an unexpected response";
    }

    return normalized;
  }

  function getResponseMessage(body, response, rawBody) {
    if (body?.message) {
      return body.message;
    }

    if (body?.status === "CLIENT_SECRET_REQUIRED") {
      return "Secret is required before token exchange";
    }

    return response.ok
      ? ""
      : getFallbackMessage(rawBody, response.statusText);
  }

  const resolveCredential = useCallback(
    async function resolveCredential({
      value,
      clientId,
      clientSecret,
      refreshToken,
      tokenType,
      expiresAt,
      expiresIn,
      entryId,
      agency,
    }) {
      console.groupCollapsed(
        `%c[credentials][client] resolve`,
        "color:#d97706;font-weight:bold;"
      );
      console.info("request", {
        valuePreview: maskValue(value),
        clientId,
        hasClientSecret: Boolean(clientSecret),
        hasRefreshToken: Boolean(refreshToken),
        tokenType: tokenType || null,
        expiresAt: expiresAt || null,
        expiresIn: expiresIn || null,
        entryId: entryId || null,
        agency: agency || null,
      });

      let response;

      try {
        response = await fetch("/api/credentials/resolve", {
          method: "POST",
          headers: {
            ...getCredentialRequestHeaders({
              "Content-Type": "application/json",
            }),
          },
          body: JSON.stringify({
            value,
            clientId,
            clientSecret,
            refreshToken,
            tokenType,
            expiresAt,
            expiresIn,
            entryId,
            agency,
          }),
        });
      } catch (error) {
        const result = {
          ok: false,
          statusCode: 0,
          statusText: "FETCH_FAILED",
          rawBody: "",
          status: "FETCH_FAILED",
          message: error?.message || "Failed to fetch",
        };

        console.info("response", {
          ok: result.ok,
          statusCode: result.statusCode,
          status: result.status,
          message: result.message,
          network: null,
          detectedIp: null,
          safeEntry: null,
        });
        console.groupEnd();

        return result;
      }

      const rawBody = await response.text().catch(() => "");
      let body = {};

      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        body = {};
      }

      const result = {
        ok: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        rawBody,
        message: getResponseMessage(body, response, rawBody),
        ...body,
      };

      console.info("response", {
        ok: result.ok,
        statusCode: result.statusCode,
        status: result.status,
        message: result.message,
        network: result.network || null,
        detectedIp: result.detectedIp || null,
        safeEntry: result.safeEntry
          ? {
              id: result.safeEntry.id,
              type: result.safeEntry.type,
              clientId: result.safeEntry.clientId,
              tokenPreview: maskValue(result.safeEntry.token),
              requiresClientSecret: result.safeEntry.requiresClientSecret,
            }
          : null,
      });
      console.groupEnd();

      return result;
    },
    []
  );

  return { resolveCredential };
}
