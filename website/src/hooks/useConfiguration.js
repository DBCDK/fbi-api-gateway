import fetch from "isomorphic-unfetch";
import { useEffect, useRef } from "react";
import useSWR from "swr";

import { isToken } from "@/components/utils";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import useStorage from "./useStorage";
import useInternalNetworkCheck from "./useInternalNetworkCheck";

const TOKEN_REFRESH_BUFFER_MS = 20 * 1000;
const scheduledClientRefreshes = new Map();
const syncedResolvedTokens = new Map();

function getRefreshDeadline(config = {}, { usesCredentialEndpoint = false } = {}) {
  if (usesCredentialEndpoint) {
    return Number.isFinite(config?.resolvedExpiresAt)
      ? config.resolvedExpiresAt
      : null;
  }

  if (typeof config?.expires === "string") {
    const parsed = Date.parse(config.expires);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

const STATUS_MAP = {
  200: "OK",
  404: "EXPIRED",
  401: "INVALID",
  428: "CLIENT_SECRET_REQUIRED",
  500: "ERROR",
};

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getCredentialRequestHeaders(),
  });

  const status = response.status;

  if (response.status !== 200) {
    return {
      config: {},
      statusCode: status,
      status: STATUS_MAP[status] || "ERROR",
    };
  }

  const config = await response.json();

  return { config, statusCode: 200, status: "OK" };
};

export default function useConfiguration(
  props,
  { enabled = true, syncResolvedToken = true } = {}
) {
  const { setApplicationEntry, setSelectedToken } = useStorage();
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const token = props?.token?.replace(/test.*:/, "");
  const agency = props?.agency;
  const entryId = props?.id || null;
  const isClientEntry =
    props?.type === "client" ||
    (typeof props?.clientId === "string" && Boolean(props.clientId));
  const isValid = enabled && isToken(props?.token);
  const usesCredentialEndpoint = isClientEntry && Boolean(entryId);

  const credentialParams = new URLSearchParams();
  if (entryId) {
    credentialParams.set("entryId", entryId);
  } else if (token) {
    credentialParams.set("token", token);
  }
  if (agency) {
    credentialParams.set("agency", agency);
  }
  if (entryId) {
    credentialParams.set("networkCheck", internalNetworkCheck);
  }

  const baseUrl = usesCredentialEndpoint
    ? entryId
      ? `/api/credentials/configuration?${credentialParams.toString()}`
      : null
    : token
      ? `/api/smaug?token=${token}`
      : null;
  const agencyUrl = usesCredentialEndpoint
    ? null
    : token && agency
      ? `/api/smaug?token=${token}&agency=${agency}`
      : null;

  const { data: baseData, error: baseError, mutate: mutateBase } = useSWR(
    isValid && baseUrl,
    fetcher
  );

  const { data: agencyData, error: agencyError, mutate: mutateAgency } = useSWR(
    isValid && agencyUrl,
    fetcher
  );

  const requestKey = [
    entryId || token || "",
    agency || "",
    usesCredentialEndpoint ? internalNetworkCheck : "",
  ].join(":");
  const data = agencyData || baseData;
  const error = agencyError || baseError;
  const isLoadingBase = isValid && !baseData && !baseError;
  const isLoadingAgency = Boolean(agencyUrl) && !agencyData && !agencyError;
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (!isValid) {
      previousDataRef.current = null;
      return;
    }

    if (data?.config && Object.keys(data.config).length > 0) {
      previousDataRef.current = {
        key: requestKey,
        data,
      };
    }
  }, [data, isValid, requestKey]);

  const stableData = isValid
    ? data || (previousDataRef.current?.key === requestKey
        ? previousDataRef.current.data
        : null)
    : null;
  const canAutoRefresh = stableData?.config?.resolvedCanAutoRefresh === true;

  useEffect(() => {
    if (!usesCredentialEndpoint || !canAutoRefresh) {
      return undefined;
    }

    const refreshDeadline = getRefreshDeadline(stableData?.config, {
      usesCredentialEndpoint,
    });

    if (!refreshDeadline) {
      scheduledClientRefreshes.delete(requestKey);
      return undefined;
    }

    const delay = Math.max(
      refreshDeadline - Date.now() - TOKEN_REFRESH_BUFFER_MS,
      0
    );
    const existing = scheduledClientRefreshes.get(requestKey);

    if (existing && existing.refreshDeadline === refreshDeadline) {
      return undefined;
    }

    if (existing?.timeout) {
      window.clearTimeout(existing.timeout);
    }

    const timeout = window.setTimeout(() => {
      scheduledClientRefreshes.delete(requestKey);
      mutateBase?.();
      mutateAgency?.();
    }, delay);

    scheduledClientRefreshes.set(requestKey, {
      refreshDeadline,
      timeout,
    });

    return () => {
      const current = scheduledClientRefreshes.get(requestKey);

      if (current?.timeout === timeout) {
        window.clearTimeout(timeout);
        scheduledClientRefreshes.delete(requestKey);
      }
    };
  }, [
    entryId,
    mutateAgency,
    mutateBase,
    props?.clientId,
    requestKey,
    canAutoRefresh,
    stableData?.config,
    usesCredentialEndpoint,
  ]);

  useEffect(() => {
    const resolvedToken = stableData?.config?.resolvedToken;

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
      stableData?.config?.resolvedExpiresAt || "",
    ].join(":");

    if (syncedResolvedTokens.get(requestKey) === syncKey) {
      return;
    }

    syncedResolvedTokens.set(requestKey, syncKey);

    setApplicationEntry({
      id: entryId,
      type: stableData?.config?.resolvedType || props?.type || "token",
      token: resolvedToken,
      clientId: stableData?.config?.resolvedClientId || props?.clientId || null,
      hasClientSecret:
        stableData?.config?.resolvedHasClientSecret ?? props?.hasClientSecret,
      hasRefreshToken:
        stableData?.config?.resolvedHasRefreshToken ?? props?.hasRefreshToken,
      supportsRefreshToken:
        stableData?.config?.resolvedSupportsRefreshToken ??
        props?.supportsRefreshToken,
      profile: props?.profile,
      agency: props?.agency,
      configuration: stableData?.config,
    });

    setSelectedToken(resolvedToken, props?.profile, props?.agency, {
      id: entryId,
      type: stableData?.config?.resolvedType || props?.type || "token",
      clientId: stableData?.config?.resolvedClientId || props?.clientId || null,
      hasClientSecret:
        stableData?.config?.resolvedHasClientSecret ?? props?.hasClientSecret,
    });
  }, [
    entryId,
    props?.agency,
    props?.clientId,
    props?.hasClientSecret,
    props?.hasRefreshToken,
    props?.profile,
    props?.supportsRefreshToken,
    props?.token,
    props?.type,
    requestKey,
    setApplicationEntry,
    setSelectedToken,
    stableData?.config,
    stableData?.config?.resolvedClientId,
    stableData?.config?.resolvedHasClientSecret,
    stableData?.config?.resolvedHasRefreshToken,
    stableData?.config?.resolvedSupportsRefreshToken,
    stableData?.config?.resolvedToken,
    stableData?.config?.resolvedType,
    syncResolvedToken,
    usesCredentialEndpoint,
  ]);

  return {
    configuration: stableData?.config,
    status: stableData?.status,
    isLoading: isLoadingBase || isLoadingAgency,
  };
}
