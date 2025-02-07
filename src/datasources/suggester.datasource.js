/**
 * @file Get suggestions
 *
 */

import config from "../config";

const { url, prefix, ttl, token, teamLabel } = config.datasources.suggester;

export async function load(
  {
    q,
    workType = null,
    // suggestType defaults to all
    suggestType = "all",
    suggestTypes,
    unique_works = true,
    limit,
    profile,
  },
  context
) {
  const selectedSuggestTypes = suggestTypes ? suggestTypes : [suggestType];
  const searchParams = new URLSearchParams({
    q: q,
    ...(workType && { worktype: workType.toLowerCase() }),
    unique_works,
    limit: limit || 10,
    profile: profile.name,
  });
  selectedSuggestTypes.forEach((type) =>
    searchParams.append("type", type.toLowerCase())
  );

  const res = await context.fetch(`${url}?${searchParams}`);

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

export { teamLabel };
