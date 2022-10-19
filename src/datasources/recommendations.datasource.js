/**
 * @file This is for the prototype, will likely be deleted soon
 */

import request from "superagent";
import { log } from "dbc-node-logger";
import config from "../config";

const { url, prefix, ttl } = config.datasources.recommendations;

export async function load({ pid, limit = 10, profile, branchId }) {
  const body = {
    like: [pid],
    agencies: [profile.agency],
    persistent_work: true,
    limit,
  };
  if (branchId) {
    body.branchid = branchId;
  }
  try {
    return (await request.post(url).send(body)).body;
  } catch (e) {
    log.error("Request to recommender failed." + " Message: " + e.message);

    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
