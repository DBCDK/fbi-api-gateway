/**
@file moodkidsrecommend.datasource.js
	Datasource for Recommender for kids based on mood data. Output is workIds

the query can contain:

tags: Object with tags and their weights, ie {"gys": 5}
work: Persistent workid to base recommendations on
filters: Filter pids based on filtertype and values. Can filter by the following types:
difficulty, illustrations_level, length, realistic_vs_fictional: A list of values, ie [5] or [2, 3]
lit_type: Can be either "fiction", "nonfiction" or "not_specified"
branch_id, department, location, sublocation: Holdings filters, each a list of strings, ie ["610162", "610134"] or ["basissamling"]
status: A list containing "ONSHELF", "ONLOAN", or both. Case-sensitive.
use_online_holdings: Boolean. When true or omitted, include works in the eReolen collection, if false falls back to the physical holdings.
dislikes: A list of persistent workids that will not occur in result
agency: The agency with which to filter results.
profile: The profile name with which to filter results. Only profile names that exist with the provided agency are valid.
offset: Number of recommendations to skip
limit: Maximum number of returned results
debug: if true debug information is present in response. Otherwise, only persistent work ids are returned.

 **/

import config from "../../config";

const { url, prefix, ttl, token, teamLabel } =
  config.datasources.moodkidsrecommend;

/**
 * parse tags into objects fit for datasource.
 * .. it looks a bit dangerous:
 *     "skæve karakterer": 3, "fantasy": 4
 *    tags are parsed into object where the tag is set as key of object
 *
 * @param tags
 * @returns {{}}
 */
function parseTags(tags) {
  const ret = {};
  tags?.map((tag) => (ret[tag.tag] = tag.weight));
  return ret;
}

/**
 * Map filter .. camelCase to snake_case
 * @param filters
 * @returns {{}}
 */
function parseFilters(filters) {
  const mappedFilters = {
    ...(filters?.illustrationsLevel && {
      illustrations_level: filters.illustrationsLevel,
    }),
    ...(filters?.realisticVsFictional && {
      realistic_vs_fictional: filters.realisticVsFictional,
    }),
    ...(filters?.fictionNonfiction && {
      lit_type: filters.fictionNonfiction.toLowerCase(),
    }),
    ...(filters?.difficulty && {
      difficulty: filters.difficulty,
    }),
    ...(filters?.length && {
      length: filters.length,
    }),
    ...(filters?.branchId && {
      branch_id: filters.branchId,
    }),
    ...(filters?.department && {
      department: filters.department,
    }),
    ...(filters?.location && {
      location: filters.location,
    }),
    ...(filters?.sublocation && {
      sublocation: filters.sublocation,
    }),
    ...(filters?.status && {
      status: filters.status,
    }),
    ...(typeof filters?.useOnlineHoldings === "boolean" && {
      use_online_holdings: filters.useOnlineHoldings,
    }),
  };

  return mappedFilters;
}

function setQuery(args) {
  const { tags, work, filters, dislikes, offset, limit, agency, profile } =
    args;

  return {
    tags: parseTags(tags),
    limit: limit || 10,
    offset: offset || 0,
    work: work,
    ...(filters && { filters: parseFilters(filters) }),
    ...(dislikes && { dislikes: dislikes }),
    agency: agency,
    profile: profile,
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

  const response = await context.fetch(url, {
    method: "POST",
    body: JSON.stringify(query),
  });

  if (response.status !== 200) {
    return { response: [] };
  }

  return response.body;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
