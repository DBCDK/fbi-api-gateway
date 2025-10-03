// datasources/elk.js
import config from "../config";

const { user, password, url, prefix } = config.datasources.elk;
const AUTH_HEADER =
  "Basic " + Buffer.from(`${user}:${password}`).toString("base64");

// --- Helpers: logging + coverage ---
function getLogger(context) {
  const info =
    context?.logger?.info?.bind?.(context.logger) || console.log.bind(console);
  const warn =
    context?.logger?.warn?.bind?.(context.logger) || console.warn.bind(console);
  return { info, warn };
}

function logCoverage(json, context) {
  const { info, warn } = getLogger(context);
  try {
    const took = json?.took;
    const timedOut = json?.timed_out === true;
    const agg = json?.aggregations?.["2"];
    const buckets = agg?.buckets || [];
    const outerCount = buckets.length;
    const sumOther = agg?.sum_other_doc_count || 0;
    const sumTop = buckets.reduce((s, b) => s + (b?.doc_count || 0), 0);
    const total = sumTop + sumOther;
    const coverage = total > 0 ? sumTop / total : 0; // 0% hvis total=0 giver mere mening

    info(
      "[ELK] took=%s ms timed_out=%s outerBuckets=%s sum_other=%s coverage=%s doc_count_error_upper_bound=%s",
      took,
      timedOut,
      outerCount,
      sumOther,
      (coverage * 100).toFixed(1) + "%",
      agg?.doc_count_error_upper_bound
    );

    // Log inner coverage for de første få outer buckets (kun hvis der ER noget "other")
    const SAMPLE = 8;
    for (const [idx, b] of buckets.slice(0, SAMPLE).entries()) {
      const inner = b?.["3"];
      if (!inner) continue;
      const innerTop = (inner.buckets || []).reduce(
        (s, x) => s + (x?.doc_count || 0),
        0
      );
      const innerOther = inner?.sum_other_doc_count || 0;
      if (innerOther > 0) {
        const innerTotal = innerTop + innerOther;
        const innerCov = innerTotal > 0 ? innerTop / innerTotal : 0;
        info(
          "[ELK] inner coverage q#%s key=%s buckets=%s other=%s coverage=%s",
          idx,
          String(b?.key ?? "").slice(0, 80),
          inner?.buckets?.length ?? 0,
          innerOther,
          (innerCov * 100).toFixed(1) + "%"
        );
      }
    }

    if (timedOut) {
      warn(
        "[ELK] WARNING: Elasticsearch timed_out=true — overvej lavere size eller snævrere interval."
      );
    }
  } catch (e) {
    // Slug fejl i logging — berør ikke normal drift
    console.warn("[ELK] coverage log failed:", e?.message);
  }
}

// Brug context.fetch hvis til stede (wrapper: {status, ok, body}); ellers global fetch (Node 20)
export async function load({ start, end }, context) {
  const body = {
    size: 0,
    // Fjern disse to, hvis din ES-version ikke understøtter dem
    track_total_hits: false,
    timeout: "12s",

    aggs: {
      2: {
        terms: {
          field: "parsedQuery.keyword",
          order: { _count: "desc" }, // mest sete queries først
          size: 1200, // moderat for 1 dags datasæt
          shard_size: 1800,
          // ingen shard_size -> lad ES selv vælge
          show_term_doc_count_error: true,
          execution_hint: "map", // kan fjernes hvis ES-versionen ikke understøtter den
        },
        aggs: {
          3: {
            terms: {
              field: "clientId.keyword",
              order: { _count: "desc" },
              size: 250, // moderat antal klienter pr. query
              shard_size: 500,
              // ingen shard_size -> lad ES selv vælge
              missing: "__MISSING__", // medtag docs uden clientId
              execution_hint: "map", // kan fjernes hvis ES-versionen ikke understøtter den
            },
          },
        },
      },
    },

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
                lt: end, // <--- VIGTIGT: brug "lt" i stedet for "lte" for rullende vindue
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
      // log coverage før return
      logCoverage(r.body, context);
      return r.body; // parsed JSON
    }
    // fallback: hvis wrapper returnerer direkte JSON
    if (r && typeof r === "object" && !("ok" in r)) {
      logCoverage(r, context);
      return r;
    }
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
  const json = await res.json();
  // log coverage før return
  logCoverage(json, context);
  return json;
}

export const options = {
  redis: { prefix, ttl: 60 * 60 * 24 },
};
