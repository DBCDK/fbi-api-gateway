/**
 * @file Facets
 */

import config from "../config";
import { mapFilters, mapToFacetEnum } from "../utils/filtersAndFacetsMap";

const { url, prefix, ttl, token, firstHits, disableFuzzySearch } =
  config.datasources.facets;

export async function load({ q, filters = {}, profile, limit = 10 }, context) {
  const { agency, name } = profile;
  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    debug: false,
    agency,
    "facets.first_hits": firstHits,
    profile: name,
    "facets.intelligent_facet": true,
  };

  // merge variables and statics
  const query = {
    q,
    // Rename some of the filter names
    filters: mapFilters(filters),
    "facet.limit": limit,
    disable_fuzzy_search: disableFuzzySearch,
    ...statics,
  };

  const res = (
    await context.fetch(url, {
      method: "POST",
      body: JSON.stringify(query),
      timeoutMs: 60000,
    })
  ).body;

  return {
    facets: res?.facets?.map?.((obj) => ({
      type: mapToFacetEnum(obj.name),
      ...obj,
    })),
  };
}

export const options = {
  redis: {
    prefix: "intelligent-" + prefix,
    ttl,
  },
};
