/**
 * @file Simple search is used for testing, this file will be deleted
 * when other search service is ready
 */

import request from "superagent";
import { withRedis } from "./redis.datasource";

export const find = async ({ q }) => {
  return (
    await request
      .post("http://simple-search-bibdk-1-0.mi-prod.svc.cloud.dbc.dk/search")
      .send({
        q,
        debug: true,
        options: { "include-phonetic-creator": false }
      })
  ).body;
};

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(keys.map(async key => await find(key)));
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix: "simplesearch",
  ttl: 60 * 60 * 24
});
