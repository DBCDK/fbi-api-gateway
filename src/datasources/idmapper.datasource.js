/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import { withRedis } from "./redis.datasource";

export const get = async ({ pid }) =>
  (
    await request
      .post("http://id-mapper-1-0.mi-prod.svc.cloud.dbc.dk/map/pid-to-workpids")
      .send([pid])
  ).body[pid];

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(keys.map(async key => await get({ pid: key })));
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix: "idmapper",
  ttl: 60 * 60 * 24
});
