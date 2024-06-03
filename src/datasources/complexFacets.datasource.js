/**
 * @file complexFacets.datasource.js
 * For getting facets only - endpoint with NO upper for facetLimit
 *
 * mostly a copy of complexSearch.datasource.js - with less arguments and slimmer output
 */

import config from "../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix } = config.datasources.complexFacets;

/**
 * Prefix facets - the enum holds name af the index - here we prefix
 * with the type of index (phrase).
 *
 * @TODO .. is this a good idea ?
 * @TODO .. this code is duplicate from complexSearch.datasource.js .. fix
 *
 * @param facets
 * @returns {*}
 */
function prefixFacets(facets) {
  // update - some facets should NOT be prefixed with 'phrase'
  const NO_PREFIX_PLEASE = ["LIX", "LET", "PUBLICATIONYEAR"];

  const mappedfacets = facets.map((fac) => {
    if (NO_PREFIX_PLEASE.includes(fac)) {
      return fac.toLowerCase();
    } else {
      return `phrase.${fac.toLowerCase()}`;
    }
  });

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
