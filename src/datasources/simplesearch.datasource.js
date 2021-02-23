/**
 * @file Simple search is used for testing, this file will be deleted
 * when other search service is ready
 */

import request from "superagent";
import monitor from "../utils/monitor";
import { withRedis } from "./redis.datasource";
import config from "../config";

const { url, prefix } = config.datasources.simplesearch;

async function find({ q }) {
  return (
    await request.post(url).send({
      "access-token": "479317f0-3f91-11eb-9ba0-4c1d96c9239f",
      q,
      debug: true,
      options: { "include-phonetic-creator": false },
    })
  ).body;
}

// find monitored
const monitored = monitor(
  { name: "REQUEST_simplesearch", help: "simplesearch requests" },
  find
);

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(keys.map(async (key) => await monitored(key)));
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix,
  ttl: 60 * 60 * 24,
});
