/** @file moodWorkRecommend.datasource.js

The service provides one post method that takes a json structure, with the following keys:
	likes: Workids to base recommendations on
dislikes: Workids that will not occur in result
limit: maxresults is the number of returned results
offset: Paging offset
max_author_recommendations: limits number of recommendation by same author (default is None)
threshold: do not return recommendations with value below or equal to threshold (default is 0.0)
agency, profile: Agency and Profile filter: the recommender only returns works available for the given agencyid and profile. Profile is just valid with a given agencyid, e.g. profile="opac" or "cicero - uden netmedier", agencyid=726500 (see https://vip.dbc.dk/lists)
	has_cover: Has-Cover filter: only returns works with an associated cover if set to True. Default is False.
	debug: Prints debug information as tag overlap, common clicks, item details
At least one workid must be provided to create recommendations.

 **/

import config from "../../config";

const { url, prefix, ttl, token , teamLabel } = config.datasources.moodrecommend;

function setQuery(args) {
  const {
    likes,
    dislikes,
    limit,
    offset,
    maxAuthorRecommendations,
    threshold,
    agency,
    profile,
    hasCover,
  } = args;
  return {
    likes: likes,
    ...(dislikes && { dislikes: dislikes }),
    limit: limit || 10,
    offset: offset || 0,
    ...(maxAuthorRecommendations && {
      max_author_recommendations: maxAuthorRecommendations,
    }),
    ...(threshold && { threshold: parseFloat(threshold) }),
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
  const response = await context.fetch(`${url}work-recommender`, {
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
