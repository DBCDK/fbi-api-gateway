import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });

  const status = response.status;

  if (response.status !== 200) {
    return { config: {}, status };
  }

  const config = await response.json();

  return { config, status };
};

export default function useConfiguration(token) {
  const url = `/api/smaug?token=${token?.token}`;
  const isValid = isToken(token?.token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: { config: {}, status: null },
  });

  return (
    {
      configuration: data?.config,
      status: data?.status,
      isLoading: !data && !error && isValid,
    } || {}
  );
}
