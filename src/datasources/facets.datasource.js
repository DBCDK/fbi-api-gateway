/**
 * @file Facets
 */

import config from "../config";
import uniq from "lodash/uniq";
import { mapFromFacetEnums, mapFilters } from "../utils/filtersAndFacetsMap";

const { url, prefix, ttl, token, firstHits, disableFuzzySearch, teamLabel } =
  config.datasources.facets;

export async function load({ q, filters = {}, facets = [], profile }, context) {
  const { agency, name } = profile;
  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    debug: false,
    agency,
    "facets.first_hits": firstHits,
    profile: name,
  };

  const mappedFacets = mapFromFacetEnums(facets);
  const mappedFilters = mapFilters(filters);

  // merge variables and statics
  const query = {
    q,
    filters: mappedFilters,
    facets: uniq(mappedFacets),
    disable_fuzzy_search: disableFuzzySearch,
    ...statics,
  };

  const result = await context.fetch(url, {
    method: "POST",
    body: JSON.stringify(query),
    timeoutMs: 60000,
  });

  // If an error is returned from simpleSearch, we return only the simpleSearch facet names to generate empty results.
  if (result.status !== 200) {
    return mappedFacets.map((facet) => ({
      name: facet,
    }));
  }

  const res = result.body;

  return Object.entries(res?.facets).map(([name, facetResult]) => {
    return {
      name,
      values: Object.entries(facetResult).map(([term, count]) => {
        return { term, count };
      }),
    };
  });
}

export const options = {
  allowDebug: true,
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
