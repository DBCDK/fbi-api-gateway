// datasources/elk.js
import config from "../config";

const { user, password, url, prefix } = config.datasources.elk;
const AUTH_HEADER =
  "Basic " + Buffer.from(`${user}:${password}`).toString("base64");

// Brug context.fetch hvis til stede (wrapper: {status, ok, body}); ellers global fetch (Node 20)
export async function load({ start, end }, context) {
  const body = {
    aggs: {
      2: {
        terms: {
          field: "parsedQuery.keyword",
          order: { _key: "desc" }, // som din oprindelige
          size: 1000,
        },
        aggs: {
          3: {
            terms: {
              field: "clientId.keyword",
              order: { _count: "desc" },
              size: 1000,
            },
          },
        },
      },
    },
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "@timestamp", format: "date_time" },
      { field: "alerts.time", format: "date_time" },
      { field: "params.expires", format: "date_time" },
      { field: "request.query.expires", format: "date_time" },
      { field: "response.data.lastUpdated", format: "date_time" },
      { field: "time.end", format: "date_time" },
      { field: "time.start", format: "date_time" },
      { field: "timestamp", format: "date_time" },
      { field: "upSince", format: "date_time" },
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          { match_all: {} },
          {
            range: {
              timestamp: {
                gte: start,
                lte: end,
                format: "strict_date_optional_time",
              },
            },
          },
        ],
        should: [],
        must_not: [],
      },
    },
  };

  const init = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: AUTH_HEADER,
    },
    body: JSON.stringify(body),
  };

  // 1) jeres wrapper
  if (context?.fetch) {
    const r = await context.fetch(url, init);
    // forventet form { status, ok, body }
    if (r && typeof r === "object" && "ok" in r) {
      if (r.ok === false) {
        const status = r.status ?? "unknown";
        const snippet = r.body ? JSON.stringify(r.body).slice(0, 800) : "";
        throw new Error(
          `Elasticsearch request failed: ${status}${snippet ? " – " + snippet : ""}`
        );
      }
      return r.body; // parsed JSON
    }
    // fallback: hvis wrapper returnerer direkte JSON
    if (r && typeof r === "object" && !("ok" in r)) return r;
  }

  // 2) global fetch (Node 20)
  const res = await fetch(url, init);
  if (!res.ok) {
    let details = "";
    try {
      details = (await res.text()).slice(0, 800);
    } catch {}
    throw new Error(
      `Elasticsearch request failed: ${res.status} ${res.statusText}${details ? " – " + details : ""}`
    );
  }
  return res.json();
}

export const options = {
  redis: { prefix, ttl: 60 * 60 * 24 },
};
