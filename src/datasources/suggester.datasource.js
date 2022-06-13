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
  suggestType = ["creator", "subject", "title"],
  unique_works = true,
  profile,
  limit,
}) {
  const types = suggestType.map((sug) => sug.toLowerCase());

  const result = url.includes("prosper")
    ? await request
        .post(url)
        .set("Authorization", `bearer ${token}`)
        .send({
          q: q,
          agency: profile.agency,
          rows: limit || 10,
          type: types,
        })
    : await request.get(url).query({
        q: q,
        worktype: workType,
        unique_works,
        type: suggestType === "COMPOSIT" ? "all" : suggestType?.toLowerCase(),
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
