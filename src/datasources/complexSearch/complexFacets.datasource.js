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
import { resolveFacetAliases } from "./facetAliases";

const { url, ttl, prefix, teamLabel } = config.datasources.complexFacets;

/**
 * Search via complex search
 */
export async function load(
  { cql, profile, filters, cqlfilter, facets, facetLimit },
  context
) {
  const aliases = await resolveFacetAliases(
    prefixFacets(facets || []),
    url,
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
    facets: aliases.restore(json?.facets),
  };
}

export const options = {
  redis: {
    prefix: "complexFacets-" + prefix,
    ttl,
    staleWhileRevalidate: 24 * 60 * 60,
    dedupe: {
      waitTimeoutMs: 5_000,
      lockTtlMs: 8_000,
    },
  },
};

export { teamLabel };
