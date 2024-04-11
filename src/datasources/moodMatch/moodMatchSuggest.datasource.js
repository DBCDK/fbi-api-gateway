/**
@file moodmatch.js
	Datasource for appeal data - that is words describing a mood for a work - eg. scary, funny etc. Service
	returns workIds

the query can contain:

q: Query parameter
field: The field to search in. Options are title, creator, moodtags and all. Default is all
offset: search result to start from, useful for pagination
limit: number of search result to return
agency: the agency id of the requesting library
profile: the vip profile used by the requesting library
debug: if true debug information is present in response. Otherwise, only persistent work ids are returned.
 **/

import config from "../../config";

const { url, prefix, ttl, token } = config.datasources.moodmatch;

function setQuery(params) {
  const { q, limit, agency, profile, debug } = params;
  return {
    q: q,
    limit: limit || 10,
    agency: agency,
    profile: profile,
  };
}

export async function load({ q, limit, agency, profile }, context) {
  const query = setQuery({ q, limit, agency, profile });
  const res = await context.fetch(
    `${url}suggest?${new URLSearchParams(query)}`
  );

  const body = res.body;
  return body;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
