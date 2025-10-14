// src/hooks/useSchema.js
import useSWR from "swr";
import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import useStorage from "./useStorage";

/**
 * Build the GraphQL endpoint from window.origin + selected profile.
 * - Calls hooks unconditionally (rules-of-hooks safe)
 * - SSR-safe: returns null when window is not available yet
 */
export function useGraphQLUrl(origin) {
  const { selectedToken } = useStorage(); // ✅ hook always called
  const profile = selectedToken?.profile ?? "default";
  const encodedProfile = encodeURIComponent(profile);

  // SSR: no window → no base URL yet
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");

  return base ? `${base}/${encodedProfile}/graphql` : null;
}

/**
 * useSchema
 * - Uses a STRING SWR key (endpoint or null)
 * - Fetches only when a token exists
 * - Keeps tolerant non-200 behavior (returns {}) to avoid forcing error UIs
 */
export default function useSchema(token, _url) {
  // Call hook unconditionally, then choose value (rules-of-hooks safe)
  const computedEndpoint = useGraphQLUrl();
  const endpoint = _url ?? computedEndpoint;

  const hasToken = Boolean(token?.token);

  // STRING key (like your original working version)
  const swrKey = hasToken && endpoint ? endpoint : null;

  const authHeader = token?.token
    ? { Authorization: `bearer ${token.token}` }
    : {};

  const fetcher = async (fetchUrl) => {
    const res = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        query: getIntrospectionQuery({ inputValueDeprecation: true }),
      }),
    });

    // Tolerant behavior: keep returning {} on non-200 like your original code
    if (res.status !== 200) return {};

    const json = await res.json();
    // If data is missing, keep shape predictable
    if (!json?.data) return { schema: null, schemaStr: null, json };

    const schema = buildClientSchema(json.data);
    const schemaStr = printSchema(schema);
    return { schema, schemaStr, json };
  };

  const {
    data,
    isLoading: swrLoading,
    error,
    isValidating,
    mutate,
  } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Loading only when we actually fetch (never when token is missing or SSR has no endpoint yet)
  const isIdle = !hasToken || !endpoint;
  const isLoading = !isIdle && swrLoading;

  return {
    schema: data?.schema ?? null,
    schemaStr: data?.schemaStr ?? null,
    json: data?.json ?? null,
    isLoading,
    isIdle,
    isValidating,
    error: error ?? null,
    mutate,
    endpoint: endpoint ?? null,
    hasToken,
  };
}
