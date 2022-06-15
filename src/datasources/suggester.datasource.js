/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";
import config from "../config";

const { url, prefix, ttl, token } = config.datasources.suggester;

export async function load({
  q,
  workType = null,
  // suggestType defaults to all
  suggestType = "all",
  unique_works = true,
  limit,
}) {
  const result = await request.get(url).query({
    q: q,
    ...(workType && { worktype: workType.toLowerCase() }),
    unique_works,
    type: suggestType.toLowerCase(),
    limit: limit || 10,
  });

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
    prefix,
    ttl,
  },
};
