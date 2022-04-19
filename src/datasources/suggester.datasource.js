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
  worktype = null,
  suggesttype = "all",
  unique_works = true,
  profile,
}) {
  const result = url.includes("prosper")
    ? await request.post(url).set("Authorization", `bearer ${token}`).send({
        q: q,
        worktype,
        unique_works,
        agency: profile.agency,
      })
    : await request.get(url).query({
        q: q,
        worktype,
        unique_works,
        type: suggesttype,
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
