import fetch from "isomorphic-unfetch";
import { useMemo } from "react";
import useSWR from "swr";

import { buildClientSchema, getIntrospectionQuery } from "graphql";

export default function useSchema(token) {
  const url = "/graphql";

  const fetcher = async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${token}`,
      },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    });

    if (response.status !== 200) {
      return {};
    }
    return await response.json();
  };

  const { data } = useSWR(token && url, fetcher);

  const schema = useMemo(() => {
    if (data?.data) {
      return buildClientSchema(data.data);
    }
  }, [data]);

  return {
    schema,
    isLoading: !data,
  };
}
