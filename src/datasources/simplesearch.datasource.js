/**
 * @file Simple search
 */

import config from "../config";
import { mapFilters } from "../utils/filtersAndFacetsMap";

const { url, prefix, ttl, token, teamLabel } = config.datasources.simplesearch;

export async function load(
  { q, filters = {}, limit = 10, offset = 0, profile, search_exact = false },
  context
) {
  const { agency, name } = profile;

  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    options: { "include-phonetic-creator": false },
    debug: false,
    search_exact: search_exact,
  };

  const mappedFilters = mapFilters(filters);
  // merge variables and statics
  const query = {
    q,
    filters: mappedFilters,
    start: offset,
    rows: limit,
    ...statics,
    agency,
    profile: name,
    search_exact,
  };

  // do the request
  const response = (
    await context.fetch(url, { method: "POST", body: JSON.stringify(query) })
  ).body;

  // Get hitcount
  const hitcount = response?.hits;

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

export { teamLabel };
