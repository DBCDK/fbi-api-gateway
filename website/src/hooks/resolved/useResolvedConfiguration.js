import { useEffect } from "react";
import useSWR from "swr";
import fetch from "isomorphic-unfetch";

import { isToken } from "@/components/utils";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import useInternalNetworkCheck from "../credentials/useInternalNetworkCheck";
import useStableSWRData from "../useStableSWRData";

const TOKEN_REFRESH_BUFFER_MS = 20 * 1000;
const scheduledClientRefreshes = new Map();

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

export default function useResolvedConfiguration(props, { enabled = true } = {}) {
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const token = props?.token?.replace(/test.*:/, "");
  const agency = props?.agency;
  const entryId = props?.id || null;
  const isClientEntry =
    props?.type === "client" ||
    (typeof props?.clientId === "string" && Boolean(props.clientId));
  const usesCredentialEndpoint = isClientEntry && Boolean(entryId);
  const hasValidToken = isToken(props?.token);
  const hasLookupTarget = usesCredentialEndpoint ? Boolean(entryId) : hasValidToken;
  const isValid = enabled && hasLookupTarget;

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
    baseUrl && isValid ? baseUrl : null,
    fetcher
  );

  const { data: agencyData, error: agencyError, mutate: mutateAgency } = useSWR(
    agencyUrl && isValid ? agencyUrl : null,
    fetcher
  );

  const requestKey = [
    entryId || token || "",
    agency || "",
    usesCredentialEndpoint ? internalNetworkCheck : "",
  ].join(":");
  const stableKey = [entryId || token || "", agency || ""].join(":");
  const data = agencyData || baseData;
  const error = agencyError || baseError;
  const isLoadingBase = isValid && !baseData && !baseError;
  const isLoadingAgency = Boolean(agencyUrl) && !agencyData && !agencyError;

  const stableData = useStableSWRData({
    data,
    enabled: isValid,
    cacheKey: stableKey,
    hasMeaningfulData: (value) =>
      Boolean(value?.config && Object.keys(value.config).length > 0),
  });
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
    canAutoRefresh,
    mutateAgency,
    mutateBase,
    requestKey,
    stableData?.config,
    usesCredentialEndpoint,
  ]);

  return {
    configuration: stableData?.config,
    status: stableData?.status,
    isLoading: !stableData && (isLoadingBase || isLoadingAgency),
    mutate: async () => {
      await Promise.all([mutateBase?.(), mutateAgency?.()].filter(Boolean));
    },
    usesCredentialEndpoint,
    requestKey,
  };
}
