import config from "../config";

const { url, prefix, teamLabel } = config.datasources.complexsearch;

/**
 * Fetch complex search indexes
 */
export async function load(args, context) {
  const [indexes, search, facets, sort] = await Promise.all(
    ["/indexes", "/indexes/search", "/indexes/facets", "/indexes/sort"].map(
      (path) =>
        context?.fetch(`${url}${path}`, {
          method: "GET",
          timeoutMs: 60000,
        })
    )
  );

  const allIndexMap = {};
  indexes?.body?.forEach(
    (index) =>
      (allIndexMap[index] = { index, search: false, facet: false, sort: false })
  );
  search?.body?.forEach((index) => {
    if (allIndexMap[index]) {
      allIndexMap[index].search = true;
    }
  });
  facets?.body?.forEach((index) => {
    if (allIndexMap[index]) {
      allIndexMap[index].facet = true;
    }
  });
  sort?.body?.forEach((index) => {
    if (allIndexMap[index]) {
      allIndexMap[index].sort = true;
    }
  });

  return indexes?.body?.map((index) => allIndexMap[index]);
}

export const options = {
  redis: {
    prefix: prefix + "indexes-1",
    ttl: 60 * 60,
    staleWhileRevalidate: 2 * 60 * 60,
  },
};

export { teamLabel };
