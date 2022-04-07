/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import { log } from "dbc-node-logger";
import config from "../config";
const { agencyId } = config.profile;

export async function load({ pid, limit = 10 }) {
  try {
    return (
      (
        await request
          //.post("http://recompass-work-1-2.mi-prod.svc.cloud.dbc.dk/recompass-work")
          .post("http://booklens-1-1.mi-prod.svc.cloud.dbc.dk")
          .send({
            like: [pid],
            agencies: [agencyId],
            persistent_work: true,
            limit,
          })
      ).body
    );
  } catch (e) {
    log.error("Request to recommender failed." + " Message: " + e.message);

    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}

export const options = {
  redis: {
    prefix: "recommendations-1",
    ttl: 60 * 60 * 24,
  },
};
