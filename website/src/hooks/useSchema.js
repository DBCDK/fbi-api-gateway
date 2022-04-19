import { useRouter } from "next/router";
import fetch from "isomorphic-unfetch";
import { useMemo } from "react";
import useSWR from "swr";

import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import useStorage from "./useStorage";

export function useGraphQLUrl() {
  const { selectedToken } = useStorage();
  const { agency = "190101", profile = "default" } = selectedToken || {};

  return `${
    typeof window !== "undefined" && window.location.origin
  }/${agency}/${profile}/graphql`;
}
export default function useSchema(token) {
  const url = useGraphQLUrl();

  const fetcher = async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${token?.token}`,
      },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    });

    if (response.status !== 200) {
      return {};
    }
    return await response.json();
  };

  const { data } = useSWR(token?.token && [url, token?.token], fetcher);

  const schema = useMemo(() => {
    if (data?.data) {
      return buildClientSchema(data.data);
    }
  }, [data]);

  const schemaStr = useMemo(() => {
    if (schema) {
      return printSchema(schema);
    }
  }, [schema]);

  return {
    schema,
    schemaStr,
    isLoading: !data,
  };
}
