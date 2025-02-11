/**
@file moodtagrecommend.datasource.js
	Datasource for Recommender based on mood data. Input are mood data (tags). output is workids

the query can contain:

tags: List of tags
limit: Maximum number of returned results, set to 10 by default
plus: List of tags that must be present in the results
minus: List of tags that cannot be in results
agency, profile: Agency and Profile filter: the recommender only returns works available for the given agencyid and profile.
 Profile is just valid with a given agencyid, e.g. profile="opac" or "cicero - uden netmedier", agencyid=726500 (see https://vip.dbc.dk/lists)
has_cover: Has-Cover filter: only returns works with an associated cover if set to True. Default is False.

 **/

import config from "../../config";

const { url, prefix, ttl, token, teamLabel } = config.datasources.moodrecommend;

function setQuery(args) {
  const { tags, limit, plus, minus, agency, profile, hasCover } = args;
  return {
    tags: tags,
    limit: limit || 10,
    ...(plus && { plus: plus }),
    ...(minus && { minus: minus }),
    agency: parseInt(agency),
    profile: profile,
    has_cover: hasCover || false,
  };
}

/**
 * this is a POST service .. as opposed to other mood services ??
 * @param args
 * @param context
 * @returns {Promise<*>}
 */
export async function load(args, context) {
  const query = setQuery(args);

  const response = await context.fetch(`${url}tag-recommender`, {
    method: "POST",
    body: JSON.stringify(query),
  });
  const body = response.body;
  return body.response;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
