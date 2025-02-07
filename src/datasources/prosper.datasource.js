/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";
import config from "../config";

const { url, prefix, ttl, token , teamLabel } = config.datasources.prosper;
export async function load(
  {
    q,
    // suggestType defaults to all
    suggestType = ["creator", "subject", "title"],
    profile,
    branchId,
    limit,
  },
  context
) {
  const types = suggestType.map((sug) => sug.toLowerCase());

  const res = await context.fetch(url, {
    method: "POST",
    headers: { Authorization: `bearer ${token}` },
    body: JSON.stringify({
      q: q,
      agency: profile.agency,
      rows: limit || 10,
      type: types,
      ...(branchId && { branchid: branchId }),
      profile: profile.name,
    }),
  });

  const body = res.body;

  if (Array.isArray(body)) {
    return body;
  }
  return body.response;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
