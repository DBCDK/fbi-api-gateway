/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";
import config from "../config";

const { url, prefix, ttl, token } = config.datasources.prosper;
export async function load({
  q,
  // suggestType defaults to all
  suggestType = ["creator", "subject", "title"],
  profile,
  branch,
  limit,
}) {
  const types = suggestType.map((sug) => sug.toLowerCase());
  const result = await request
    .post(url)
    .set("Authorization", `bearer ${token}`)
    .send({
      q: q,
      agency: profile.agency,
      rows: limit || 10,
      type: types,
      ...(branch && { branch: branch }),
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
