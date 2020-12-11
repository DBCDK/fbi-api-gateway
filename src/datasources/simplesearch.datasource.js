/**
 * @file Simple search is used for testing, this file will be deleted
 * when other search service is ready
 */

import request from "superagent";
import monitor from "../utils/monitor";
import { withRedis } from "./redis.datasource";

async function find({ q }) {
  return (
    await request
      .post("http://simple-search-bibdk-1-0.mi-prod.svc.cloud.dbc.dk/search")
      .send({
        q,
        debug: true,
        options: { "include-phonetic-creator": false }
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
  return await Promise.all(keys.map(async key => await monitored(key)));
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix: "simplesearch",
  ttl: 60 * 60 * 24
});
