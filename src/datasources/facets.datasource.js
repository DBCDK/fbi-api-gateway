/**
 * @file Facets
 */

import config from "../config";
import uniq from "lodash/uniq";

const {
  url,
  prefix,
  ttl,
  token,
  firstHits,
  disableFuzzySearch,
} = config.datasources.facets;

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

  // merge variables and statics
  const query = {
    q,
    filters,
    facets: uniq(facets),
    disable_fuzzy_search: disableFuzzySearch,
    ...statics,
  };

  const res = (
    await context.fetch(url, { method: "POST", body: JSON.stringify(query) })
  ).body;

  return Object.entries(res.facets).map(([name, facetResult]) => {
    return {
      name,
      values: Object.entries(facetResult).map(([term, count]) => {
        return { term, count };
      }),
    };
  });
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
