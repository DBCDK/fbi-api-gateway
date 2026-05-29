/**
 * @file SWR hook for loading configuration data for a credential entry via
 * either a direct token or a server-side credential session entry id.
 */
import fetch from "isomorphic-unfetch";
import { useEffect, useRef } from "react";
import useSWR from "swr";

const STATUS_MAP = {
  200: "OK",
  401: "INVALID",
  404: "EXPIRED",
  428: "CLIENT_SECRET_REQUIRED",
  500: "ERROR",
};

const fetcher = async (url) => {
  const response = await fetch(url, { method: "GET" });
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
} = {}) {
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

  const url = hasLookupTarget
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

  return {
    configuration: stableData?.config || {},
    status: stableData?.status,
    isLoading: !!url && !data && !error,
    mutate,
  };
}
