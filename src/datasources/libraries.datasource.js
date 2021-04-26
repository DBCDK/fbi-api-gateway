import request from 'superagent';
import monitor from '../utils/monitor';
import {withRedis} from './redis.datasource';
import config from "../config";

const endpoint = "/libraries"
async function Libraries(agencyid) {
  // @TODO access token ??
  const url = config.datasources.openplatform.url + endpoint;
  return (
      await request
      .post(url)
      .send({
        "access_token": "qwerty",
        "agencyIds": [
          `${agencyid.q}`
        ]
      })
  ).body.data;
}

// find monitored
const monitored = monitor(
    {name: 'REQUEST_libraries', help: 'libraries endpoint'},
    Libraries,
);

/**
 * A DataLoader batch function
 *
 * Get libraries by agencyID (key.q)
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export default async function batchLoader(keys) {
  // NOTE call monitor
  // NOTE use redish
  return await Promise.all(keys.map((key) => Libraries(key)));
}


