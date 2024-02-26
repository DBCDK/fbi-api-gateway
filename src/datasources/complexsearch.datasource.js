import config from "../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix } = config.datasources.complexsearch;

/**
 * Prefix facets - the enum holds name af the index - here we prefix
 * with the type of index (phrase).
 *
 * @TODO .. is this a good idea ?
 *
 * @param facets
 * @returns {*}
 */
function prefixFacets(facets) {
  return facets.map((fac) => `phrase.${fac}`);
}

/**
 * Search via complex search
 */
export async function load(
  { cql, offset, limit, profile, filters, sort, facets, facetLimit },
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
    facets: prefixFacets(facets || []),
    facetLimit: facetLimit,
    trackingId: context?.trackingId,
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
    facets: json?.facets || [],
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
