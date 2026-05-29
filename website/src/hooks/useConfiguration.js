import fetch from "isomorphic-unfetch";
import { useEffect, useRef } from "react";
import useSWR from "swr";

import { isToken } from "@/components/utils";
import useStorage from "./useStorage";

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

export default function useConfiguration(props) {
  const { setHistoryItem, setSelectedToken } = useStorage();
  const token = props?.token?.replace(/test.*:/, "");
  const agency = props?.agency;
  const entryId = props?.id || null;
  const isValid = isToken(props?.token);
  const usesCredentialEndpoint = Boolean(entryId);

  const credentialParams = new URLSearchParams();
  if (entryId) {
    credentialParams.set("entryId", entryId);
  } else if (token) {
    credentialParams.set("token", token);
  }
  if (agency) {
    credentialParams.set("agency", agency);
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

  const { data: baseData, error: baseError } = useSWR(
    isValid && baseUrl,
    fetcher
  );

  const { data: agencyData, error: agencyError } = useSWR(
    isValid && agencyUrl,
    fetcher
  );

  const data = agencyData || baseData;
  const error = agencyError || baseError;
  const isLoadingBase = isValid && !baseData && !baseError;
  const isLoadingAgency = Boolean(agencyUrl) && !agencyData && !agencyError;
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (data?.config && Object.keys(data.config).length > 0) {
      previousDataRef.current = data;
    }
  }, [data]);

  const stableData = data || previousDataRef.current;

  useEffect(() => {
    const resolvedToken = stableData?.config?.resolvedToken;

    if (!usesCredentialEndpoint || !resolvedToken || resolvedToken === props?.token) {
      return;
    }

    setHistoryItem({
      id: entryId,
      type: stableData?.config?.resolvedType || props?.type || "token",
      token: resolvedToken,
      clientId: stableData?.config?.resolvedClientId || props?.clientId || null,
      profile: props?.profile,
      agency: props?.agency,
      configuration: stableData?.config,
    });

    setSelectedToken(resolvedToken, props?.profile, props?.agency, {
      id: entryId,
      type: stableData?.config?.resolvedType || props?.type || "token",
      clientId: stableData?.config?.resolvedClientId || props?.clientId || null,
    });
  }, [
    entryId,
    props?.agency,
    props?.clientId,
    props?.profile,
    props?.token,
    props?.type,
    setHistoryItem,
    setSelectedToken,
    stableData?.config,
    stableData?.config?.resolvedClientId,
    stableData?.config?.resolvedToken,
    stableData?.config?.resolvedType,
    usesCredentialEndpoint,
  ]);

  return (
    {
      configuration: stableData?.config,
      status: stableData?.status,
      isLoading: isLoadingBase || isLoadingAgency,
    } || {}
  );
}
