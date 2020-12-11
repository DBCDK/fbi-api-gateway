/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import monitor from "../utils/monitor";
import { withRedis } from "./redis.datasource";

async function find({ pid, limit = 10 }) {
  return (
    await request
      .post("http://recompass-work-1-2.mi-prod.svc.cloud.dbc.dk/recompass-work")
      .send({
        likes: [pid],
        limit
      })
  ).body;
}

// find monitored
const monitored = monitor(
  { name: "REQUEST_recommendations", help: "recommendations requests" },
  find
);

/**
 * A DataLoader batch function
 *
 * Could be optimised to fetch all pids in a single
 * moreinfo request.
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
  prefix: "recommendations",
  ttl: 60 * 60 * 24
});
