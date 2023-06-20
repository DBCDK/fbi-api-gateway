import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const fetcher = async (url) => {
  console.log("url", url);

  const response = await fetch(url, {
    method: "GET",
  });

  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useComplexity({ token, query, variables }) {
  console.log("useComplexity f", { query, variables });

  const url = `/complexity?token=${token}&query=${query}&variables=${variables}`;
  const isValid = isToken(token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });

  console.log({ data, error });

  return (
    {
      complexity: data?.complexity,
      limit: 1000,
      isLoading: !data && !error && isValid,
    } || {}
  );
}
