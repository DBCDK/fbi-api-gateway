// hooks/useInsights.js
import { useMemo } from "react";
import useSWR from "swr";
import { useGraphQLUrl } from "./useSchema";

const SCOPE_CONFIG = {
  fields: {
    resultField: "fields",
    keyField: "path",
    clientField: "fieldClients",
    clientArgument: "field",
  },
  arguments: {
    resultField: "arguments",
    keyField: "key",
    clientField: "argumentClients",
    clientArgument: "argument",
  },
  inputFields: {
    resultField: "inputFields",
    keyField: "key",
    clientField: "inputFieldClients",
    clientArgument: "inputField",
  },
};

function aggregateUsage(data, scopeConfig) {
  const items = data?.data?.insights?.[scopeConfig.resultField];
  if (!items?.length) return { map: {}, list: [] };

  const list = items
    .map((item) => ({ ...item, count: item?.count || 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    map: Object.fromEntries(
      list.map((item) => [item[scopeConfig.keyField], item])
    ),
    list,
  };
}

function normalizeDimensionFilter(filter) {
  if (typeof filter === "string") {
    const value = filter.trim();
    return { include: value, exclude: "" };
  }
  const value = filter?.value?.trim() || "";
  return {
    include: filter?.mode === "include" ? value : "",
    exclude: filter?.mode === "exclude" ? value : "",
  };
}

/**
 * useInsights(auth, options?)
 * - auth: { token: string | {token:string}, profile: string }
 * - options?: { from?: string, to?: string, field?: string, origin?: string }
 *
 * Returnerer:
 *  - json, byField, byFieldMap, byFieldList, clientUsage
 *  - isLoading  (første load)
 *  - isValidating (revalidation/baggrunds-fetch)
 *  - isFetching (true hvis der hentes — både første load og revalidate)
 *  - error, mutate
 */
export default function useInsights(auth, options = {}) {
  const tokenLike = auth?.token;
  const bearer = typeof tokenLike === "string" ? tokenLike : tokenLike?.token;

  const { origin, elementKey } = options;
  const scope = SCOPE_CONFIG[options.scope] ? options.scope : "fields";
  const scopeConfig = SCOPE_CONFIG[scope];
  const clientFilter = normalizeDimensionFilter(options.clientId);
  const agencyFilter = normalizeDimensionFilter(options.agencyId);
  const profileFilter = normalizeDimensionFilter(options.profileName);
  const clientId = clientFilter.include;
  const excludeClientId = clientFilter.exclude;
  const agencyId = agencyFilter.include;
  const excludeAgencyId = agencyFilter.exclude;
  const profileName = profileFilter.include;
  const excludeProfileName = profileFilter.exclude;
  const from = options.from || "";
  const to = options.to || "";

  const url = useGraphQLUrl(origin);

  const resultSelection =
    scope === "fields"
      ? `path type field kind count clientCount operationCount firstSeen lastSeen`
      : `key count clientCount operationCount firstSeen lastSeen`;
  const query = `query ($from: String, $to: String, $clientId: String, $excludeClientId: String, $agencyId: String, $excludeAgencyId: String, $profileName: String, $excludeProfileName: String) {
    insights(from: $from, to: $to, clientId: $clientId, excludeClientId: $excludeClientId, agencyId: $agencyId, excludeAgencyId: $excludeAgencyId, profileName: $profileName, excludeProfileName: $excludeProfileName) {
      start
      end
      ${scopeConfig.resultField} {
        ${resultSelection}
      }
    }
  }`;

  // VIGTIGT: nøgle med primitive værdier (ingen objekt-refs).
  const key =
    bearer && url && from
      ? [
          url,
          query,
          bearer,
          from,
          to,
          clientId,
          excludeClientId,
          agencyId,
          excludeAgencyId,
          profileName,
          excludeProfileName,
        ]
      : null;

  const fetcher = async (
    u,
    q,
    b,
    start,
    end,
    client,
    excludedClient,
    agency,
    excludedAgency,
    profile,
    excludedProfile
  ) => {
    const variables = {
      from: start || null,
      to: end || null,
      clientId: client || null,
      excludeClientId: excludedClient || null,
      agencyId: agency || null,
      excludeAgencyId: excludedAgency || null,
      profileName: profile || null,
      excludeProfileName: excludedProfile || null,
    };

    if (process.env.NODE_ENV !== "production") {
      console.info("[useInsights] fetch", {
        url: u,
        from: start || null,
        to: end || "now",
      });
    }

    const res = await fetch(u, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${b}`,
      },
      body: JSON.stringify({ query: q, variables }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(
        `GraphQL ${res.status} ${res.statusText} – ${text.slice(0, 500)}`
      );
      err.status = res.status;
      throw err;
    }
    const body = await res.json();
    if (body?.errors?.length) {
      throw new Error(body.errors.map(({ message }) => message).join("; "));
    }
    return body;
  };

  // SWR: isLoading (første load), isValidating (baggrunds-fetch)
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: false,
      dedupingInterval: 0, // ingen “debounce” ved ændring af days
      keepPreviousData: true, // behold forrige data mens vi henter ny
    }
  );

  const clientsQuery = `query ($elementKey: String!, $from: String, $to: String, $clientId: String, $excludeClientId: String, $agencyId: String, $excludeAgencyId: String, $profileName: String, $excludeProfileName: String) {
    insights(from: $from, to: $to, clientId: $clientId, excludeClientId: $excludeClientId, agencyId: $agencyId, excludeAgencyId: $excludeAgencyId, profileName: $profileName, excludeProfileName: $excludeProfileName) {
      ${scopeConfig.clientField}(${scopeConfig.clientArgument}: $elementKey) {
        clientId
        count
        operationCount
        firstSeen
        lastSeen
        configuration {
          displayName
        }
      }
    }
  }`;
  const clientsKey =
    bearer && url && from && elementKey
      ? [
          url,
          clientsQuery,
          bearer,
          elementKey,
          from,
          to,
          clientId,
          excludeClientId,
          agencyId,
          excludeAgencyId,
          profileName,
          excludeProfileName,
        ]
      : null;
  const clientsFetcher = async (
    u,
    q,
    b,
    selectedElement,
    start,
    end,
    client,
    excludedClient,
    agency,
    excludedAgency,
    profile,
    excludedProfile
  ) => {
    const res = await fetch(u, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${b}`,
      },
      body: JSON.stringify({
        query: q,
        variables: {
          elementKey: selectedElement,
          from: start || null,
          to: end || null,
          clientId: client || null,
          excludeClientId: excludedClient || null,
          agencyId: agency || null,
          excludeAgencyId: excludedAgency || null,
          profileName: profile || null,
          excludeProfileName: excludedProfile || null,
        },
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`GraphQL ${res.status} ${res.statusText}`);
    }
    if (body?.errors?.length) {
      throw new Error(body.errors.map(({ message }) => message).join("; "));
    }
    return body;
  };
  const clientsRequest = useSWR(clientsKey, clientsFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: false,
  });

  const usage = useMemo(
    () => aggregateUsage(data, scopeConfig),
    [data, scopeConfig]
  );
  const clientUsage =
    clientsRequest.data?.data?.insights?.[scopeConfig.clientField] || [];

  // Praktisk flag til UI: vis loader når vi henter — uanset om det er initialt eller revalidate
  const isFetching =
    (!!key && isLoading) ||
    isValidating ||
    (!!clientsKey && clientsRequest.isLoading) ||
    clientsRequest.isValidating;
  const isInitialLoading = !!key && isLoading && !data;
  const isClientLoading =
    !!clientsKey && clientsRequest.isLoading && !clientsRequest.data;

  return {
    json: data,
    usageMap: usage.map,
    usageList: usage.list,
    byField: usage.map,
    byFieldMap: usage.map,
    byFieldList: usage.list,
    clientUsage,
    isLoading: !!key && isLoading, // initial fetch
    isInitialLoading,
    isClientLoading,
    isValidating, // revalidation
    isFetching, // samlet “vi henter nu”-flag til din tabel
    error: error || clientsRequest.error,
    mutate,
  };
}
