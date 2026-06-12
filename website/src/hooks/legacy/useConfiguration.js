import { useEffect } from "react";

import useCredentialEntries from "../credentials/useCredentialEntries";
import useCredentialMutations from "../credentials/useCredentialMutations";
import useResolvedConfiguration from "../resolved/useResolvedConfiguration";

const syncedResolvedTokens = new Map();

export default function useConfiguration(
  props,
  { enabled = true, syncResolvedToken = true } = {}
) {
  const { setCredentialEntry } = useCredentialEntries();
  const { selectCredential } = useCredentialMutations();
  const {
    configuration,
    status,
    isLoading,
    usesCredentialEndpoint,
    requestKey,
  } = useResolvedConfiguration(props, { enabled });

  useEffect(() => {
    const resolvedToken = configuration?.resolvedToken;

    if (
      !syncResolvedToken ||
      !usesCredentialEndpoint ||
      !resolvedToken ||
      resolvedToken === props?.token
    ) {
      return;
    }

    const syncKey = [
      requestKey,
      resolvedToken,
      configuration?.resolvedExpiresAt || "",
    ].join(":");

    if (syncedResolvedTokens.get(requestKey) === syncKey) {
      return;
    }

    syncedResolvedTokens.set(requestKey, syncKey);

    setCredentialEntry({
      id: props?.id || null,
      type: configuration?.resolvedType || props?.type || "token",
      token: resolvedToken,
      clientId: configuration?.resolvedClientId || props?.clientId || null,
      hasClientSecret:
        configuration?.resolvedHasClientSecret ?? props?.hasClientSecret,
      hasRefreshToken:
        configuration?.resolvedHasRefreshToken ?? props?.hasRefreshToken,
      supportsRefreshToken:
        configuration?.resolvedSupportsRefreshToken ??
        props?.supportsRefreshToken,
      profile: props?.profile,
      agency: props?.agency,
      configuration,
    });

    selectCredential(
      resolvedToken,
      props?.profile,
      props?.agency,
      {
        id: props?.id || null,
        type: configuration?.resolvedType || props?.type || "token",
        clientId: configuration?.resolvedClientId || props?.clientId || null,
        hasClientSecret:
          configuration?.resolvedHasClientSecret ?? props?.hasClientSecret,
      },
      { reorderApplications: false }
    );
  }, [
    configuration,
    configuration?.resolvedClientId,
    configuration?.resolvedExpiresAt,
    configuration?.resolvedHasClientSecret,
    configuration?.resolvedHasRefreshToken,
    configuration?.resolvedSupportsRefreshToken,
    configuration?.resolvedToken,
    configuration?.resolvedType,
    props?.agency,
    props?.clientId,
    props?.hasClientSecret,
    props?.hasRefreshToken,
    props?.id,
    props?.profile,
    props?.supportsRefreshToken,
    props?.token,
    props?.type,
    requestKey,
    selectCredential,
    setCredentialEntry,
    syncResolvedToken,
    usesCredentialEndpoint,
  ]);

  return {
    configuration,
    status,
    isLoading,
  };
}
