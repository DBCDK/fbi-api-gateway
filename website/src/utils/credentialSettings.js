const DISABLE_INTERNAL_NETWORK_CHECK_KEY =
  "graphiql:disable-internal-network-check";
const DISABLE_INTERNAL_NETWORK_CHECK_HEADER =
  "x-disable-internal-network-check";

export function getDisableInternalNetworkCheck() {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(DISABLE_INTERNAL_NETWORK_CHECK_KEY) === "disabled";
}

export function getCredentialRequestHeaders(headers = {}) {
  return {
    ...headers,
    [DISABLE_INTERNAL_NETWORK_CHECK_HEADER]: getDisableInternalNetworkCheck()
      ? "true"
      : "false",
  };
}

export { DISABLE_INTERNAL_NETWORK_CHECK_HEADER };
