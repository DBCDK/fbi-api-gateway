// hooks/useInsights.js
import { useMemo } from "react";
import useSWR from "swr";

function getGraphQLUrl(profile, origin) {
  const base =
    origin || (typeof window !== "undefined" ? window.location.origin : "");
  return base ? `${base}/${profile || "default"}/graphql` : "";
}

function aggregateByField(data) {
  const clients = data?.data?.insights?.clients;
  if (!clients?.length) return { map: {}, list: [] };

  const map = new Map(); // key => acc
  for (const { clientId, fields } of clients) {
    for (const f of fields || []) {
      const key = `${f.type}.${f.field}`;
      if (!map.has(key)) {
        map.set(key, {
          path: f.path,
          type: f.type,
          field: f.field,
          kind: f.kind,
          count: 0,
          clients: new Set(),
        });
      }
      const acc = map.get(key);
      acc.count += f.count || 0;
      if (clientId) acc.clients.add(clientId);
    }
  }

  const list = Array.from(map.values())
    .map((x) => ({ ...x, clients: Array.from(x.clients) }))
    .sort((a, b) => b.count - a.count);

  const obj = Object.fromEntries(list.map((x) => [`${x.type}.${x.field}`, x]));
  return { map: obj, list };
}

function getByClient(data) {
  return data?.data?.insights?.clients || [];
}

/**
 * useInsights(auth, options?)
 * - auth: { token: string | {token:string}, profile: string }
 * - options?: { clientId?: string, origin?: string }
 */
export default function useInsights(auth, options = {}) {
  const tokenLike = auth?.token;
  const profile = auth?.profile;
  const bearer = typeof tokenLike === "string" ? tokenLike : tokenLike?.token;

  const { clientId, origin } = options;
  const url = useMemo(() => getGraphQLUrl(profile, origin), [profile, origin]);

  const query = `query($clientId: String) {
    insights {
      start
      end
      clients(clientId: $clientId) {
        clientId
        fields {
          path
          type
          field
          kind
          count
        }
      }
    }
  }`;

  const key = bearer && url ? [url, query, bearer, { clientId }] : null;

  const fetcher = async (u, q, b, variables) => {
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
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    dedupingInterval: 5_000,
  });

  const byFieldAgg = useMemo(() => aggregateByField(data), [data]);
  const byClient = useMemo(() => getByClient(data), [data]);

  return {
    json: data,
    byField: byFieldAgg.map, // bagudkompatibelt navn (din komponent bruger byField)
    byFieldMap: byFieldAgg.map, // alias
    byFieldList: byFieldAgg.list,
    byClient,
    isLoading: !!key && isLoading,
    error,
    mutate,
  };
}
