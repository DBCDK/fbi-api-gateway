/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";

export async function load({ pid, limit = 10 }) {
  return (
    (
      await request
        //.post("http://recompass-work-1-2.mi-prod.svc.cloud.dbc.dk/recompass-work")
        .post("http://booklens-1-1.mi-prod.svc.cloud.dbc.dk")
        .send({
          like: [pid],
          agencies: [190101],
          persistent_work: true,
          limit,
        })
    ).body
  );
}

export const options = {
  redis: {
    prefix: "recommendations-1",
    ttl: 60 * 60 * 24,
  },
};
