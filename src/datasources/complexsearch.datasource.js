import config from "../config";

const { url, ttl, prefix } = config.datasources.complexsearch;

/**
 * Search via complex search
 */
export async function load({ cql, offset, limit, profile }, context) {
  // TODO service needs to support profile ...

  const res = await context?.fetch(`${url}/cqlquery`, {
    method: "POST",
    body: JSON.stringify({
      cqlQuery: cql,
      pagination: { offset, limit },
    }),
    allowedErrorStatusCodes: [400],
  });
  const json = res.body;
  return {
    errorMessage: json?.errorMessage,
    works: json?.workdIds || [],
    hitcount: json?.numFound || 0,
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
