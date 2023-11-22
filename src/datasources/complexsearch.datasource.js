import config from "../config";

const { url, ttl, prefix } = config.datasources.complexsearch;

/**
 * Search via complex search
 */
export async function load(
  { cql, offset, limit, profile, filters, sort },
  context
) {
  // TODO service needs to support profile ...
  const res = await context?.fetch(`${url}/cqlquery`, {
    method: "POST",
    body: JSON.stringify({
      cqlQuery: cql,
      pagination: { offset, limit },
      searchProfile: {
        agency: profile.agency,
        profile: profile.name,
      },
      filters: filters,
      ...(sort && { sort: sort }),
    }),
    allowedErrorStatusCodes: [400],
  });
  const json = res.body;

  return {
    errorMessage: json?.errorMessage,
    works: json?.workdIds || [],
    hitcount: json?.numFound || 0,
    solrQuery: json?.solrQuery || "",
    tokenizerDurationInMs: json?.tokenizerDurationInMs || 0,
    solrExecutionDurationInMs: json?.solrExecutionDurationInMs || 0,
    solrFilter: json?.solrFilter || "",
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
