/**
 * @file Simple search is used for testing, this file will be deleted
 * when other search service is ready
 */

import request from "superagent";
import config from "../config";

const { url, prefix } = config.datasources.simplesearch;

export async function load({ q, limit = 10, offset = 0 }) {
  // Ensure no null values
  if (!limit) {
    limit = 10;
  }
  if (!offset) {
    offset = 0;
  }

  const response = (
    await request.post(url).send({
      "access-token": "479317f0-3f91-11eb-9ba0-4c1d96c9239f",
      q,
      rows: 100,
      debug: true,
      options: { "include-phonetic-creator": false },
    })
  ).body;

  // Get hitcount
  const hitcount = response.result.length;

  // Select range between offset and limit
  return {
    result: response.result.slice(offset, offset + limit),
    hitcount,
  };
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 60 * 24,
  },
};
