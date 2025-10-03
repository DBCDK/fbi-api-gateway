// hooks/useInsights.js
import { useMemo } from "react";
import useSWR from "swr";

function getGraphQLUrl(profile, origin) {
  const base =
    origin || (typeof window !== "undefined" ? window.location.origin : "");
  // undgå dobbelt-slash ved fx origin med / til sidst
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = (profile && String(profile)) || "default";
  return trimmed ? `${trimmed}/${p}/graphql` : "";
}

function toIntInRange(v, def = 3) {
  const n =
    typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  const num = Number.isFinite(n) ? n : def;
  return Math.max(1, Math.min(30, num));
}

function aggregateByField(data) {
  const clients = data?.data?.insights?.clients;
  if (!clients?.length) return { map: {}, list: [] };

  const map = new Map();
  for (const { clientId, fields } of clients) {
    for (const f of fields || []) {
      // type kan i sjældne tilfælde være null (ukendt felt) -> normalisér til "Unknown"
      const type = f?.type ?? "Unknown";
      const field = f?.field ?? "(unknown)";
      const key = `${type}.${field}`;

      if (!map.has(key)) {
        map.set(key, {
          path: f?.path ?? null,
          type,
          field,
          kind: f?.kind ?? null,
          count: 0,
          clients: new Set(),
        });
      }
      const acc = map.get(key);
      acc.count += Number.isFinite(f?.count) ? f.count : 0;
      if (clientId) acc.clients.add(clientId);
    }
  }

  const list = Array.from(map.values())
    .map((x) => ({ ...x, clients: Array.from(x.clients) }))
    .sort((a, b) => b.count - a.count);

  return {
    map: Object.fromEntries(list.map((x) => [`${x.type}.${x.field}`, x])),
    list,
  };
}

function getByClient(data) {
  return data?.data?.insights?.clients || [];
}

/**
 * useInsights(auth, options?)
 * - auth: { token: string | {token:string}, profile: string }
 * - options?: { days?: number|string, clientId?: string, origin?: string }
 *
 * Returnerer:
 *  - json, byField, byFieldMap, byFieldList, byClient
 *  - isLoading  (første load)
 *  - isValidating (revalidation/baggrunds-fetch)
 *  - isFetching (true hvis der hentes — både første load og revalidate)
 *  - error, mutate
 */
export default function useInsights(auth, options = {}) {
  const tokenLike = auth?.token;
  const profile = auth?.profile;
  const bearer = typeof tokenLike === "string" ? tokenLike : tokenLike?.token;

  const { clientId, origin } = options;
  const days = toIntInRange(options?.days, 14); // coerces til tal og clamp

  const url = useMemo(() => getGraphQLUrl(profile, origin), [profile, origin]);

  const query = `query ($clientId: String, $days: Int) {
    insights(days: $days) {
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

  // VIGTIGT: nøgle med primitive værdier (ingen objekt-refs).
  const key =
    bearer && url ? [url, query, bearer, clientId || null, days] : null;

  const fetcher = async (u, q, b, cid, d) => {
    const variables = { clientId: cid || null, days: d };

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[useInsights] fetch", {
        url: u,
        clientId: cid || null,
        days: d,
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
    return res.json();
  };

  // SWR: isLoading (første load), isValidating (baggrunds-fetch)
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // ingen “debounce” ved ændring af days/clientId
      keepPreviousData: true, // behold forrige data mens vi henter ny
    }
  );

  const byFieldAgg = useMemo(() => aggregateByField(data), [data]);
  const byClient = useMemo(() => getByClient(data), [data]);

  // Praktisk flag til UI: vis loader når vi henter — uanset om det er initialt eller revalidate
  const isFetching = (!!key && isLoading) || isValidating;

  return {
    json: data,
    byField: byFieldAgg.map,
    byFieldMap: byFieldAgg.map,
    byFieldList: byFieldAgg.list,
    byClient,
    isLoading: !!key && isLoading, // initial fetch
    isValidating, // revalidation
    isFetching, // samlet “vi henter nu”-flag til din tabel
    error,
    mutate,
  };
}
