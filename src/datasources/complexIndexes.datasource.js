import config from "../config";

const { url, prefix, teamLabel } = config.datasources.complexsearch;

/**
 * Fetch complex search indexes
 */
export async function load(args, context) {
  const res = await context?.fetch(`${url}/indexes/json`, {
    method: "GET",
    timeoutMs: 60000,
  });

  return res?.body?.map((entry) => {
    return {
      index: entry.name,
      search: entry.metaInfo.searchIndex,
      sort: entry.metaInfo.sortIndex,
      facet: entry.metaInfo.facetIndex,
      aliases: entry.metaInfo.aliases,
    };
  });
}

export const options = {
  redis: {
    prefix: prefix + "indexes-2",
    ttl: 60 * 60,
    staleWhileRevalidate: 2 * 60 * 60,
  },
};

export { teamLabel };
