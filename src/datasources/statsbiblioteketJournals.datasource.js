import config from "../config";

export async function load(_key, context) {
  const res = await context?.fetch(
    `${config.datasources.statsbiblioteket.url}/copydanws/journals`,
    { headers: { Accept: "application/json" }, enableProxy: true }
  );

  const body = res.body;

  const journalsMap = body?.journals?.journal?.reduce((map, journal) => {
    map[journal.issn] = 1;
    return map;
  }, {});

  return journalsMap || {};
}

export const options = {
  external: true,
  redis: {
    prefix: "statsbiblioteketJournals22",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    inMemory: true,
  },
};
