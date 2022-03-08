import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });

  console.log("response", url, response);

  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useConfiguration(token) {
  const url = `/api/smaug?token=${token}`;

  const { data, error } = useSWR(isToken(token) && url, fetcher, {
    fallback: {},
  });

  return { configuration: data, isLoading: !data && !error } || {};
}
