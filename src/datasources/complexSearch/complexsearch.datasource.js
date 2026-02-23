import config from "../../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix, teamLabel } = config.datasources.complexsearch;

/**
 * Search via complex search
 */
export async function load(
  { cql, offset, limit, profile, filters, sort },
  context
) {
  const body = {
    cqlQuery: cql,
    pagination: { offset, limit },
    searchProfile: {
      agency: profile.agency,
      profile: profile.name,
    },
    filters: filters,
    trackingId: context?.trackingId,
    includeFilteredPids: true,
    ...(sort && { sort: sort }),
  };

  const res = await context?.fetch(`${url}/cqlquery`, {
    method: "POST",
    body: JSON.stringify(body),
    allowedErrorStatusCodes: [400],
    timeoutMs: 60000,
  });
  const json = res.body;

  if (!res.ok) {
    log.error(
      `Complex search error: ${
        json?.errorMessage
      }. Request body: ${JSON.stringify(body)}`,
      {
        trackingId: body.trackingId,
      }
    );
  }

  return {
    errorMessage: json?.errorMessage,
    works: json?.workIds || [],
    hitcount: json?.numFound || 0,
    solrQuery: json?.solrQuery || "",
    tokenizerDurationInMs: json?.tokenizerDurationInMs || 0,
    solrExecutionDurationInMs: json?.solrExecutionDurationInMs || 0,
    solrFilter: json?.solrFilter || "",
    searchHits: json.expanded || null,
  };
}

export const options = {
  // Enable per-request debugging for this datasource when "x-debug: true" is set
  allowDebug: true,
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 24 * 60 * 60,
  },
};

export { teamLabel };
