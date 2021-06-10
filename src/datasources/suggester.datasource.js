/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";

export async function load({ q }) {
  const result = await request
    .get("http://simple-suggest-1-0.mi-prod.svc.cloud.dbc.dk/suggest")
    .query({ q: q, type: ["subject", "title", "creator"] });

  if (Array.isArray(result.body)) {
    return result.body;
  }
  return JSON.parse(result.text);
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status(loadFunc) {
  await loadFunc({ q: "hest" });
}

export const options = {
  redis: {
    prefix: "suggester-1",
    ttl: 60 * 60 * 24,
  },
};
