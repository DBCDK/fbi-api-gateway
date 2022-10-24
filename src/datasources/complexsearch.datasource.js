import config from "../config";

const { url, ttl, prefix } = config.datasources.complexsearch;

/**
 * Search via complex search
 */
export async function load({ cql, profile }, context) {
  // TODO service needs to support profile, offset, limit ...

  const res = await context?.fetch(`${url}/cqlquery`, {
    method: "POST",
    body: JSON.stringify({ cqlQuery: cql }),
  });
  const json = await res.json();

  return {
    errorMessage: json?.errorMessage,
    works: json?.works?.map?.((work) => work.workId) || [],
    hitcount: json?.numFound || 0,
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
