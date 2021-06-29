/**
 * @file Simple search is used for testing, this file will be deleted
 * when other search service is ready
 */

import request from "superagent";
import config from "../config";

const { url, prefix } = config.datasources.simplesearch;

export async function load({ q, limit = 10, offset = 0, facets = [] }) {
  // get parsed arguments for query
  let queryobject = setquery(arguments[0]);

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
 * @return {{q: *, debug: boolean, start: (*|number), 'facet.type', rows: (*|number)}}
 */
function setquery(params) {
  const enumMap = {
    LITERATURE: "literature",
    MOVIE: "movie",
    ARTICLE: "article",
  };

  const facets = params.facets.map((facet) => {
    return enumMap[facet];
  });

  return {
    q: params.q,
    start: params.offset ? params.offset : 0,
    rows: params.limit ? params.limit : 10,
    "facet.type": facets,
  };
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 60 * 24,
  },
};
