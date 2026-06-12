/**
 * @file Client-side hook for attaching a refresh token to an existing
 * credential entry through the credential API.
 */
import fetch from "isomorphic-unfetch";

import { getCredentialRequestHeaders } from "@/utils/credentialSettings";

export default function useCredentialRefreshToken() {
  async function attachRefreshToken({ entryId, refreshToken, agency }) {
    const response = await fetch("/api/credentials/refresh-token", {
      method: "POST",
      headers: getCredentialRequestHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        entryId,
        refreshToken,
        agency,
      }),
    });

    const body = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      ...body,
    };
  }

  return { attachRefreshToken };
}
