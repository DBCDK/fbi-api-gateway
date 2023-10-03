import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const STATUS_MAP = { 200: "OK", 404: "EXPIRED", 401: "INVALID", 500: "ERROR" };

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

export default function useConfiguration(token) {
  const url = `/api/smaug?token=${token?.token?.replace(/test.*:/, "")}`;
  const isValid = isToken(token?.token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: { config: {}, status: null, statusCode: null },
  });

  return (
    {
      configuration: data?.config,
      status: data?.status,
      isLoading: !data && !error && isValid,
    } || {}
  );
}
