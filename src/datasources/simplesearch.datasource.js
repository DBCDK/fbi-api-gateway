/**
 * @file Simple search
 */

import request from "superagent";
import config from "../config";

const { agencyId: agency, name: profile } = config.profile;

const { url, prefix, ttl, token } = config.datasources.simplesearch;

export async function load({ q, filters, limit = 10, offset = 0 }) {
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
    filters,
    start: offset,
    rows: limit,
    ...statics,
    agency,
    profile,
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
