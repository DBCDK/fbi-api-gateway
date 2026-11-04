import fetch from "isomorphic-unfetch";
import useSWR from "swr";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });

  if (response.status !== 200) {
    return {
      isInternal: false,
      detectedIp: null,
    };
  }

  return await response.json();
};

export default function useCredentialNetwork() {
  const { data, error } = useSWR("/api/credentials/network", fetcher);
  const isInternal = data?.isInternal === true;
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const canInferAddress =
    hostname.endsWith(".svc.cloud.dbc.dk") ||
    ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  const monitoringBaseUrl =
    data?.monitoringBaseUrl ||
    (canInferAddress ? `http://${hostname}:9599` : null);

  return {
    isInternal,
    monitoringBaseUrl: isInternal ? monitoringBaseUrl : null,
    detectedIp: data?.detectedIp || null,
    isLoading: !data && !error,
  };
}
