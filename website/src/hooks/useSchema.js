import useSWR from "swr";
import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import useStorage from "./useStorage";

/**
 * Som før: bygger endpoint af window.origin + profil fra storage.
 * Bevarer tidligere adfærd, så vi ikke introducerer SSR-afhængigheder her.
 */
export function useGraphQLUrl(origin) {
  const url = origin
    ? origin
    : typeof window !== "undefined" && window.location.origin;

  const { selectedToken } = useStorage();
  const { profile = "default" } = selectedToken || {};
  const encodedProfile = encodeURIComponent(profile);

  return `${url}/${encodedProfile}/graphql`;
}

export default function useSchema(token, _url) {
  const endpoint = _url ?? useGraphQLUrl();

  // samme header casing som før refaktor (det virkede hos dig)
  const authHeader = token?.token
    ? { Authorization: `bearer ${token.token}` }
    : {};

  // fetcher modtager en STRINGS-key (url)
  const fetcher = async (fetchUrl) => {
    const response = await fetch(fetchUrl, {
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

    // Bevar “tolerant” opførsel: returnér tomt objekt ved non-200 (som før),
    // så dit nuværende UI ikke går i error-state.
    if (response.status !== 200) {
      return {};
    }

    const json = await response.json();
    const schema = buildClientSchema(json.data);
    const schemaStr = printSchema(schema);
    return { schema, schemaStr, json };
  };

  // STRINGS-key ⇒ fetcher(url). Ingen fetch når token mangler.
  const {
    data,
    isLoading: swrLoading,
    error,
  } = useSWR(token?.token ? endpoint : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Kun “loading” når vi reelt henter (aldrig når token mangler)
  const isLoading = Boolean(token?.token) ? swrLoading : false;

  return {
    schema: data?.schema,
    schemaStr: data?.schemaStr,
    json: data?.json,
    isLoading,
    error,
    endpoint,
  };
}
