/**
 * @file SWR hook for loading configuration data for a credential entry via
 * either a direct token or a server-side credential session entry id.
 */
import fetch from "isomorphic-unfetch";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import useInternalNetworkCheck from "./useInternalNetworkCheck";

const TOKEN_REFRESH_BUFFER_MS = 20 * 1000;
const scheduledItemRefreshes = new Map();

function getRefreshDeadline(config = {}) {
  return Number.isFinite(config?.resolvedExpiresAt)
    ? config.resolvedExpiresAt
    : null;
}

const STATUS_MAP = {
  200: "OK",
  401: "INVALID",
  404: "EXPIRED",
  428: "CLIENT_SECRET_REQUIRED",
  500: "ERROR",
};

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getCredentialRequestHeaders(),
  });
  const status = response.status;
  const body = await response.json().catch(() => ({}));

  if (status !== 200) {
    return {
      config: body,
      statusCode: status,
      status: STATUS_MAP[status] || "ERROR",
    };
  }

  return {
    config: body,
    statusCode: 200,
    status: "OK",
  };
};

export default function useCredentialConfiguration({
  id = null,
  token: rawToken = null,
  agency = null,
  lookupByEntryId = false,
  enabled = true,
} = {}) {
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const token = rawToken?.replace?.(/test.*:/, "");
  const entryId = id || null;

  const params = new URLSearchParams();
  let hasLookupTarget = false;

  if (lookupByEntryId === true && entryId) {
    params.set("entryId", entryId);
    hasLookupTarget = true;
  } else if (token) {
    params.set("token", token);
    hasLookupTarget = true;
  } else if (entryId) {
    params.set("entryId", entryId);
    hasLookupTarget = true;
  }

  if (agency) {
    params.set("agency", agency);
  }

  if (lookupByEntryId === true && entryId) {
    params.set("networkCheck", internalNetworkCheck);
  }

  const url = enabled && hasLookupTarget
    ? `/api/credentials/configuration?${params.toString()}`
    : null;
  const { data, error, mutate } = useSWR(url, fetcher);
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (data?.config && Object.keys(data.config).length > 0) {
      previousDataRef.current = data;
    }
  }, [data]);

  const stableData = data || previousDataRef.current;

  useEffect(() => {
    if (!lookupByEntryId) {
      return undefined;
    }

    const refreshDeadline = getRefreshDeadline(stableData?.config);

    if (!refreshDeadline) {
      scheduledItemRefreshes.delete(url);
      return undefined;
    }

    const delay = Math.max(
      refreshDeadline - Date.now() - TOKEN_REFRESH_BUFFER_MS,
      0
    );
    const existing = scheduledItemRefreshes.get(url);

    if (existing && existing.refreshDeadline === refreshDeadline) {
      return undefined;
    }

    if (existing?.timeout) {
      window.clearTimeout(existing.timeout);
    }

    console.info("[credentials][item] auto-refresh scheduled", {
      entryId,
      refreshDeadline,
      delay,
    });
    const timeout = window.setTimeout(() => {
      console.info("[credentials][item] auto-refresh fired", {
        entryId,
      });
      scheduledItemRefreshes.delete(url);
      mutate?.();
    }, delay);

    scheduledItemRefreshes.set(url, {
      refreshDeadline,
      timeout,
    });

    return () => {
      const current = scheduledItemRefreshes.get(url);

      if (current?.timeout === timeout) {
        window.clearTimeout(timeout);
        scheduledItemRefreshes.delete(url);
      }
    };
  }, [entryId, lookupByEntryId, mutate, stableData?.config, url]);

  return {
    configuration: stableData?.config || {},
    status: stableData?.status,
    isLoading: !!url && !data && !error,
    mutate,
  };
}
