/**
 * @file complexFacets.datasource.js
 * Internal use only !
 * For getting facets only - endpoint with NO upper for facetLimit
 *
 * mostly a copy of complexSearch.datasource.js - with less arguments and slimmer output
 */

import config from "../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix } = config.datasources.complexFacets;

/**
 * Prefix facets - the enum holds name af the index - here we prefix
 * with the type of index (facet).
 *
 * @TODO .. this code is duplicate from complexSearch.datasource.js .. fix
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
  { cql, profile, filters, facets, facetLimit },
  context
) {
  const body = {
    cqlQuery: cql,
    searchProfile: {
      agency: profile.agency,
      profile: profile.name,
    },
    filters: filters,
    facets: prefixFacets(facets || []),
    facetLimit: facetLimit,
    trackingId: context?.trackingId,
  };

  // TODO service needs to support profile ...
  const res = await context?.fetch(url, {
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
    hitcount: json.numFound,
    facets: json?.facets || [],
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 24 * 60 * 60,
  },
};
