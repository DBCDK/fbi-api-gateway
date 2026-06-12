import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import useResolvedConfiguration from "./useResolvedConfiguration";
import useStableSWRData from "../useStableSWRData";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getCredentialRequestHeaders(),
  });

  if (response.status !== 200) {
    return {};
  }

  const body = await response.json();
  return body.user;
};

export default function useResolvedUser(props, { enabled = true } = {}) {
  const { configuration } = useResolvedConfiguration(props, { enabled });
  const profile = props?.profile ?? configuration?.profiles?.[0] ?? null;
  const entryId = props?.id || null;
  const isClientEntry =
    props?.type === "client" ||
    (typeof props?.clientId === "string" && Boolean(props.clientId));
  const hasValidToken = isToken(props?.token);
  const usesCredentialEndpoint = isClientEntry && Boolean(entryId);
  const isValid = enabled && (usesCredentialEndpoint || hasValidToken);
  const params = new URLSearchParams();

  if (usesCredentialEndpoint) {
    params.set("entryId", entryId);
  } else if (props?.token) {
    params.set("token", props.token);
  }

  if (profile) {
    params.set("profile", profile);
  }

  const stableKey = [entryId || props?.token || "", profile || ""].join(":");
  const url = usesCredentialEndpoint
    ? `/api/credentials/user?${params.toString()}`
    : `/api/user?token=${props?.token}&profile=${profile}`;

  const { data, error, mutate } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });
  const stableData = useStableSWRData({
    data,
    enabled: isValid,
    cacheKey: stableKey,
    hasMeaningfulData: (value) => Boolean(value && Object.keys(value).length > 0),
  });

  return {
    user: stableData || {},
    isLoading: !stableData && !error && isValid,
    mutate,
  };
}
