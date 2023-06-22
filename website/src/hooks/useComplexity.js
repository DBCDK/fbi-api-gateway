import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const fetcherHest = async (url, { token, query, variables }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useComplexity({ token, query, variables }) {
  const url = `/complexity`;
  const isValid = isToken(token);
  const params = { token, query, variables };

  const { data, error } = useSWR(
    [url, params],
    (url, params) => fetcherHest(url, params),
    {
      fallback: {},
    }
  );

  console.log({ data, error });

  return (
    {
      complexity: data?.complexity,
      limit: 1000,
      isLoading: !data && !error && isValid,
    } || {}
  );
}
