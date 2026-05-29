/**
 * @file Client-side hook for resolving a user-entered token or clientId
 * through the credential API and returning the normalized server response.
 */
import fetch from "isomorphic-unfetch";

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

    const response = await fetch("/api/credentials/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      message:
        body?.message ||
        (response.ok
          ? ""
          : getFallbackMessage(rawBody, response.statusText)),
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
  }

  return { resolveCredential };
}
