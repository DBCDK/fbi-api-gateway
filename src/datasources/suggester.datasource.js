/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";

export async function load({ q, worktype = null, unique_works = true }) {
  const result = await request
    .get("http://simple-suggest-1-0.mi-prod.svc.cloud.dbc.dk/suggest")
    .query({ q: q, worktype, unique_works });

  let body;
  try {
    body = JSON.parse(result.text);
  } catch (e) {
    body = result.body;
  }

  if (Array.isArray(body)) {
    return body;
  }
  return body.response;
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
    prefix: "suggester-3",
    ttl: 60 * 60 * 24,
  },
};
