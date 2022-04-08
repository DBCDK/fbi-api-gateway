import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });

  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useConfiguration(token) {
  const url = `/api/smaug?token=${token?.token}`;
  const isValid = isToken(token?.token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });

  return { configuration: data, isLoading: !data && !error && isValid } || {};
}
