/**
 * @file complexFacetsWithLimit.datasource.js
 * For getting facets only - with upper limit for facetLimit
 */

import config from "../../config";
import { log } from "dbc-node-logger";
import { prefixFacets } from "../../utils/utils";
import { resolveFacetAliases } from "./facetAliases";

const { url, ttl, prefix, teamLabel } = config.datasources.complexsearch;

/**
 * Search via complex search
 */
export async function load(
  { cql, profile, filters, cqlfilter, facets, facetLimit },
  context
) {
  const aliases = await resolveFacetAliases(
    prefixFacets(facets || []),
    `${url}/facets`,
    context
  );
  const body = {
    cqlQuery: cql,
    searchProfile: {
      agency: profile.agency,
      profile: profile.name,
    },
    filters: filters,
    cqlfilter: cqlfilter,
    facets: aliases.facets,
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
    facets: aliases.restore(json?.facets),
  };
}

export const options = {
  redis: {
    prefix: "complexFacetsWithLimit-" + prefix,
    ttl,
    dedupe: {
      waitTimeoutMs: 5_000,
      lockTtlMs: 8_000,
    },
  },
};

export { teamLabel };
