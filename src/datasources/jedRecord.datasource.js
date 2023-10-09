import { log } from "dbc-node-logger";
import config from "../config";

const { url, prefix, ttl } = config.datasources.jed;

export async function batchLoader(keys, context) {
  const res = await context.fetch(`${url}/api/v1/fbi-api/multiple`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      includeRelations: false,
      profile: `${keys?.[0]?.profile.agency}-${keys?.[0]?.profile.name}`,
      ids: keys.map((entry) => entry.id),
    }),
  });

  return keys.map((k) => res.body.records[k.id]);
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
