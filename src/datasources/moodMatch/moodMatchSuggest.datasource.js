/**
@file moodmatchsuggest.datasource.js
	Datasource for suggestions appeal data - that is words describing a mood for a work - eg. scary, funny etc. Service
	returns terms suggested .. and a work if there is one

the query can contain:

q: Query parameter
limit: number of search result to return
agency: the agency id of the requesting library
profile: the vip profile used by the requesting library

 **/

import config from "../../config";

const { url, prefix, ttl, token, teamLabel } = config.datasources.moodmatch;

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

export { teamLabel };
