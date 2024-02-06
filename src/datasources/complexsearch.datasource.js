import config from "../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix } = config.datasources.complexsearch;

function createTrackingId() {
  const now = new Date();
  return "fbi-api-" + now.toISOString();
}

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
    trackingId: createTrackingId(),
    ...(sort && { sort: sort }),
  };
  // TODO service needs to support profile ...
  const res = await context?.fetch(`${url}/cqlquery`, {
    method: "POST",
    body: JSON.stringify(body),
    allowedErrorStatusCodes: [400],
  });
  const json = res.body;

  if (!res.ok) {
    log.error("Complex search error", { body, error });
  }
  return {
    errorMessage: json?.errorMessage,
    works: json?.workIds || [],
    hitcount: json?.numFound || 0,
    solrQuery: json?.solrQuery || "",
    tokenizerDurationInMs: json?.tokenizerDurationInMs || 0,
    solrExecutionDurationInMs: json?.solrExecutionDurationInMs || 0,
    solrFilter: json?.solrFilter || "",
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
