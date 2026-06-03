import fetch from "isomorphic-unfetch";
import { useEffect, useRef } from "react";
import useSWR from "swr";

import { isToken } from "@/components/utils";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import useConfiguration from "./useConfiguration";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getCredentialRequestHeaders(),
  });

  if (response.status !== 200) {
    return {};
  }

  const res = await response.json();

  return res.user;
};

export default function useUser(
  props,
  { enabled = true, syncResolvedToken = true } = {}
) {
  const { configuration } = useConfiguration(props, {
    enabled,
    syncResolvedToken,
  });
  const profile = props?.profile ?? configuration?.profiles?.[0] ?? null;
  const entryId = props?.id || null;
  const isValid = enabled && isToken(props?.token);
  const params = new URLSearchParams();

  if (entryId) {
    params.set("entryId", entryId);
  } else if (props?.token) {
    params.set("token", props.token);
  }

  if (profile) {
    params.set("profile", profile);
  }

  const url = entryId
    ? `/api/credentials/user?${params.toString()}`
    : `/api/user?token=${props?.token}&profile=${profile}`;

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      previousDataRef.current = data;
    }
  }, [data]);

  const stableData = data || previousDataRef.current;

  return { user: stableData, isLoading: !data && !error && isValid } || {};
}
