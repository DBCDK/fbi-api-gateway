/**
@file moodmatchsearch.datasource.js
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
import { all } from "express/lib/application";

const { url, prefix, ttl, token, teamLabel } = config.datasources.moodmatch;

function setQuery(args) {
  const { q, field, offset, limit, agency, profile, debug } = args;
  return {
    q: q,
    ...(field && { field: field.toLowerCase() }),
    offset: offset,
    limit: limit || 10,
    agency: agency,
    profile: profile,
    debug: debug,
  };
}

export async function load(args, context) {
  const query = setQuery(args);

  const res = await context.fetch(`${url}search?${new URLSearchParams(query)}`);
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
