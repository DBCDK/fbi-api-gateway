/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import { log } from "dbc-node-logger";

export async function load({ agencyId }) {
  try {
    const response = await request
      //.post("http://recompass-work-1-2.mi-prod.svc.cloud.dbc.dk/recompass-work")
      .get(
        "http://idpservice.iscrum-staging.svc.cloud.dbc.dk:8080/api/v1/queries/subscribersbyproductname/INFOMEDIA"
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
    ttl: 60,
  },
};
