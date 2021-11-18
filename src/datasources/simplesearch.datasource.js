/**
 * @file Simple search
 */

import request from "superagent";
import config from "../config";

const { url, prefix } = config.datasources.simplesearch;

export async function load({ q, filters, limit = 10, offset = 0 }) {
  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": "479317f0-3f91-11eb-9ba0-4c1d96c9239f",
    options: { "include-phonetic-creator": false },
    debug: true,
  };
  // merge variables and statics
  const query = {
    q,
    filters,
    start: offset,
    rows: limit,
    ...statics,
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
    ttl: 60 * 60 * 24,
  },
};
