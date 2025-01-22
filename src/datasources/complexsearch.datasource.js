import config from "../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix, teamLabel } = config.datasources.complexsearch;

/**
 * Prefix facets - the enum holds name af the index - here we prefix
 * with the type of index (facet).
 *
 * @TODO .. is this a good idea ?
 *
 * @param facets
 * @returns {*}
 */
function prefixFacets(facets) {
  const mappedfacets = facets.map((fac) => `facet.${fac.toLowerCase()}`);
  return mappedfacets;
}

/**
 * Search via complex search
 */
export async function load(
  {
    cql,
    offset,
    limit,
    profile,
    filters,
    sort,
    facets,
    facetLimit,
    includeFilteredPids,
  },
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
    includeFilteredPids: includeFilteredPids || false,
    ...(sort && { sort: sort }),
  };

  // TODO service needs to support profile ...
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
    facets: json?.facets || [],
    solrQuery: json?.solrQuery || "",
    tokenizerDurationInMs: json?.tokenizerDurationInMs || 0,
    solrExecutionDurationInMs: json?.solrExecutionDurationInMs || 0,
    solrFilter: json?.solrFilter || "",
    searchHits: json.expanded || null,
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 24 * 60 * 60,
  },
};

export { teamLabel };
