import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import useStorage from "./useStorage";

export function useGraphQLUrl(origin) {
  const url = origin
    ? origin
    : typeof window !== "undefined" && window.location.origin;

  const { selectedToken } = useStorage();
  const { profile = "default" } = selectedToken || {};

  // some profiles may contain spaces
  const encodedProfile = encodeURIComponent(profile);

  return `${url}/${encodedProfile}/graphql`;
}
export default function useSchema(token, _url) {
  const self = useGraphQLUrl();

  const url = _url ?? self;

  const fetcher = async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${token?.token}`,
      },
      body: JSON.stringify({
        query: getIntrospectionQuery({ inputValueDeprecation: true }),
      }),
    });

    if (response.status !== 200) {
      return {};
    }

    const json = await response.json();
    const schema = buildClientSchema(json.data);
    const schemaStr = printSchema(schema);
    return { schema, schemaStr, json };
  };

  const { data } = useSWR(token?.token && [url, token?.token], fetcher);
  return {
    schema: data?.schema,
    schemaStr: data?.schemaStr,
    json: data?.json,
    isLoading: !data,
  };
}
