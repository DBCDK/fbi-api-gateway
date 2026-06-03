/**
 * @file SWR hook for loading user/introspection data for a credential entry
 * via either a direct token or a server-side credential session entry id.
 */
import fetch from "isomorphic-unfetch";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import useInternalNetworkCheck from "./useInternalNetworkCheck";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getCredentialRequestHeaders(),
  });
  const status = response.status;

  if (response.status !== 200) {
    return {
      user: {},
      status,
    };
  }

  const body = await response.json();
  return {
    user: body.user,
    status: 200,
  };
};

export default function useCredentialUser({
  id = null,
  token: rawToken = null,
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

  if (lookupByEntryId === true && entryId) {
    params.set("networkCheck", internalNetworkCheck);
  }

  const url = enabled && hasLookupTarget
    ? `/api/credentials/user?${params.toString()}`
    : null;
  const { data, error, mutate } = useSWR(url, fetcher, {
    fallback: {},
  });
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (data?.user && Object.keys(data.user).length > 0) {
      previousDataRef.current = data;
    }
  }, [data]);

  const stableData = data || previousDataRef.current;

  return {
    user: stableData?.user || {},
    status: stableData?.status,
    isLoading: !!url && !data && !error,
    mutate,
  };
}
