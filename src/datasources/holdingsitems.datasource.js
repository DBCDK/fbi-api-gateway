/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import { log } from "dbc-node-logger";
import config from "../config";

const endpoint = "/holdingsitems";

export async function load({ accessToken, agencyId, pids }) {
  const url = config.datasources.openplatform.url + endpoint;
  try {
    const response = await request.post(url).send({
      access_token: accessToken,
      agency: agencyId,
      pids: pids,
    });

    return response.body.data;
  } catch (e) {
    log.error("Request to holdingsitems failed." + " Message: " + e.message);
    console.log(e, "ERROR");
    // @TODO what to return here
  }
}

export const options = {
  redis: {
    prefix: "holdingsitems-1",
    ttl: 60 * 15, // cache for 15 minutes
  },
};
