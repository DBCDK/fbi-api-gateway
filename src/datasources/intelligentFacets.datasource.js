/**
 * @file Facets
 */

import config from "../config";

const {
  url,
  prefix,
  ttl,
  token,
  firstHits,
  disableFuzzySearch,
} = config.datasources.facets;

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
    filters,
    "facet.limit": limit,
    disable_fuzzy_search: disableFuzzySearch,
    ...statics,
  };

  const res = (
    await context.fetch(url, { method: "POST", body: JSON.stringify(query) })
  ).body;

  return res;
}

export const options = {
  redis: {
    prefix: "intelligent-" + prefix,
    ttl,
  },
};
