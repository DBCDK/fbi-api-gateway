/**
 * @file complexFacetsWithLimit.datasource.js
 * For getting facets only - with upper limit for facetLimit
 */

import config from "../../config";
import { log } from "dbc-node-logger";
import { prefixFacets } from "../../utils/utils";

const { url, ttl, prefix, teamLabel } = config.datasources.complexsearch;

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

  const res = await context?.fetch(`${url}/facets`, {
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
    facets: (json?.facets || []).slice().sort(
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
  },
};

export { teamLabel };
