import request from "superagent";
import monitor from "../utils/monitor";
import { withRedis } from "./redis.datasource";
import config from "../config";

const endpoint = "/availability";
async function availability(pids, accessToken) {
  const url = config.datasources.openplatform.url + endpoint;
  return (
    await request.post(url).send({
      access_token: accessToken,
      pids,
    })
  ).body.data;
}

// find monitored
const monitored = monitor(
  { name: "REQUEST_availability", help: "availability endpoint" },
  availability
);

/**
 * A DataLoader batch function
 *
 * Get libraries by agencyID (key.q)
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export default async function batchLoader(keys) {
  const pids = keys.map((o) => o.pid);
  const accessToken = keys[0].accessToken;

  return await availability(pids, accessToken);
}
