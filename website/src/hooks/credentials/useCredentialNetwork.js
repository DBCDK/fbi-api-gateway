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

  return {
    isInternal: data?.isInternal === true,
    detectedIp: data?.detectedIp || null,
    isLoading: !data && !error,
  };
}
