import request from "superagent";
import config from "../config";

const endpoint = "/availability";
export async function load(pids, accessToken) {
  const url = config.datasources.openplatform.url + endpoint;
  return (
    await request.post(url).send({
      access_token: accessToken,
      pids,
    })
  ).body.data;
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export async function batchLoader(keys, loadFunc) {
  const pids = keys.map((o) => o.pid);
  const accessToken = keys[0].accessToken;

  return await loadFunc(pids, accessToken);
}
