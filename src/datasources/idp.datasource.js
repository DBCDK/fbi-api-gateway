/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import { log } from "dbc-node-logger";
import config from "../config";

const { url, ttl } = config.datasources.idp;

export async function load({ agencyId }) {
  try {
    const response = await request.get(
      `${url}//queries/subscribersbyproductname/INFOMEDIA`
    );
    return response.body.organisations;
  } catch (e) {
    log.error("Request to idp failed." + " Message: " + e.message);

    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}

export const options = {
  redis: {
    prefix: "idp-1",
    ttl: ttl,
  },
};
