/**
 * @file This is for the prototype, will likely be deleted soon
 */

import { log } from "dbc-node-logger";
import config from "../config";

const { url, ttl, prefix, teamLabel } = config.datasources.idp;

export async function load(_key, context) {
  try {
    const response = await context.fetch(
      `${url}/queries/subscribersbyproductname/INFOMEDIA`
    );

    const agencyMap = {};
    response?.body?.organisations?.forEach(
      ({ agencyId }) => (agencyMap[agencyId] = 1)
    );
    return agencyMap;
  } catch (e) {
    log.error("Request to idp failed." + " Message: " + e.message);

    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}

/*export const options = {
  redis: {
    prefix,
    ttl,
    inMemory: true,
  },
};*/

export { teamLabel };
