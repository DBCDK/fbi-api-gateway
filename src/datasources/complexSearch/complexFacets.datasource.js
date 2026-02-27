/**
 * @file complexFacets.datasource.js
 * Internal use only !
 * For getting facets only - endpoint with NO upper for facetLimit
 *
 * mostly a copy of complexSearch.datasource.js - with less arguments and slimmer output
 */

import config from "../../config";
import { log } from "dbc-node-logger";
import { prefixFacets } from "../../utils/utils";

const { url, ttl, prefix, teamLabel } = config.datasources.complexFacets;

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
    hitcount: json?.numFound,
    facets: (json?.facets || [])
      .slice()
      .sort(
        (() => {
          const order = new Map(body.facets.map((name, i) => [name, i]));
          return (a, b) =>
            (order.get(a?.name) ?? Infinity) - (order.get(b?.name) ?? Infinity);
        })()
      ),
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
