import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";
import { useGraphQLUrl } from "./useSchema";

// Fetcher
const fetcher = async (url, { token, remoteSchemaUrl, localSchemaUrl }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      remoteSchemaUrl,
      localSchemaUrl,
    }),
  });

  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useDiff(token, { remoteSchemaUrl }) {
  const url = `/diff`;
  const localSchemaUrl = useGraphQLUrl();
  const params = { ...token, remoteSchemaUrl, localSchemaUrl };

  const isValid = isToken(params?.token);

  const { data, error } = useSWR(
    [url, params],
    (url, params) => token && fetcher(url, params),
    {
      fallback: {},
    }
  );

  return (
    {
      ...data,
      isLoading: !data && !error && isValid,
    } || {}
  );
}
