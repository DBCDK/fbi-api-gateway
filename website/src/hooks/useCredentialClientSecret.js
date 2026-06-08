/**
 * @file Client-side hook for attaching a real clientSecret to an existing
 * credential entry through the credential API.
 */
import fetch from "isomorphic-unfetch";

import { getCredentialRequestHeaders } from "@/utils/credentialSettings";

export default function useCredentialClientSecret() {
  async function attachClientSecret({ entryId, clientSecret, agency }) {
    const response = await fetch("/api/credentials/client-secret", {
      method: "POST",
      headers: getCredentialRequestHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        entryId,
        clientSecret,
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

  return { attachClientSecret };
}
