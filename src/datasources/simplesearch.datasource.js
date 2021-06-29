/**
 * @file Simple search is used for testing, this file will be deleted
 * when other search service is ready
 */

import request from "superagent";
import config from "../config";

const { url, prefix } = config.datasources.simplesearch;

export async function load({ q, limit = 10, offset = 0, facets = [] }) {
  // get parsed arguments for query
  let queryobject = setQuery(arguments[0]);
  // static parameters for the search
  const statics = {
    "access-token": "479317f0-3f91-11eb-9ba0-4c1d96c9239f",
    options: { "include-phonetic-creator": false },
    debug: true,
  };
  // merge variables and statics
  const query = { ...queryobject, ...statics };
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

/**
 * parse given parameters for a searchquery
 * default values on limit(10) and offset(0) + translation of facet enum
 * @param params
 *  the parameters from api
 *
 */
function setQuery(params) {
  // make an object of the facets array
  const facetobj =
    params.facets &&
    params.facets.reduce((obj, facet) => {
      obj[`facet.${facet.field}`] = facet.value;
      return obj;
    }, {});

  // make an object of the basic parameters
  const basequery = {
    q: params.q,
    start: params.offset ? params.offset : 0,
    rows: params.limit ? params.limit : 10,
  };
  // return the merged objects
  return { ...basequery, ...facetobj };
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 60 * 24,
  },
};
