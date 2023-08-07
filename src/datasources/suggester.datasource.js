/**
 * @file Get suggestions
 *
 */

import config from "../config";

const { url, prefix, ttl, token } = config.datasources.suggester;

export async function load(
  {
    q,
    workType = null,
    // suggestType defaults to all
    suggestType = "all",
    unique_works = true,
    limit,
    profile,
  },
  context
) {
  const res = await context.fetch(
    `${url}?${new URLSearchParams({
      q: q,
      ...(workType && { worktype: workType.toLowerCase() }),
      unique_works,
      type: suggestType.toLowerCase(),
      limit: limit || 10,
      profile: profile.name,
    })}`
  );

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
