/**
 * @file Facets
 */

import request from "superagent";
import config from "../config";

const { url, prefix, ttl, token } = config.datasources.facets;

const HOLDINGS_FILTERS = [
  "branchId",
  "department",
  "location",
  "sublocation",
  "status",
];
export async function load({ q, filters, facets = [], profile }) {
  // We split filters into holdingsFilters and otherFilters.
  // This is temprorary until simplesearch have holdingsFilter in filters
  const holdingsFilter = {};
  const otherFilters = {};
  Object.entries(filters).forEach(([key, val]) => {
    if (HOLDINGS_FILTERS.includes(key)) {
      holdingsFilter[key] = val;
    } else {
      otherFilters[key] = val;
    }
  });

  const { agency, name } = profile;
  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    debug: false,
    agency,
    profile: name,
  };

  // merge variables and statics
  const query = {
    q,
    filters: otherFilters,
    holdingsFilter,
    facets,
    ...statics,
  };

  const res = (await request.post(url).send(query)).body;

  // parse
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
