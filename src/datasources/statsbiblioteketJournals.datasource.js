import request from "superagent";
import config from "../config";

export async function load() {
  const res = (
    await request
      .get(`${config.datasources.statsbiblioteket.url}/copydanws/journals`)
      .set("Accept", "application/json")
  ).body;

  const journalsMap = res.journals.journal.reduce((map, journal) => {
    map[journal.issn] = 1;
    return map;
  }, {});

  return journalsMap;
}

export const options = {
  redis: {
    prefix: "statsbiblioteketJournals4",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    inMemory: true,
  },
};
