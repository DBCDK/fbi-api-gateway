/**
 * @file Simple search
 */

import request from "superagent";
import config from "../config";

const { url, prefix, ttl, token } = config.datasources.simplesearch;

const HOLDINGS_FILTERS = [
  "branchId",
  "department",
  "location",
  "sublocation",
  "status",
];

export async function load({ q, filters, limit = 10, offset = 0, profile }) {
  const { agency, name } = profile;

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

  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    options: { "include-phonetic-creator": false },
    debug: false,
  };
  // merge variables and statics
  const query = {
    q,
    filters: otherFilters,
    holdingsFilter,
    start: offset,
    rows: limit,
    ...statics,
    agency,
    profile: name,
  };

  // do the request
  const response = (await request.post(url).send(query)).body;

  // Get hitcount
  const hitcount = response.hits;

  // Select range between offset and limit
  return {
    result: response.result,
    hitcount,
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
