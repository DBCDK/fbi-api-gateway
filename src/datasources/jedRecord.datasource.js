import { log } from "dbc-node-logger";
import config from "../config";

const { url, prefix, ttl, teamLabel } = config.datasources.jed;

export async function batchLoader(keys, context) {
  const res = await context.fetch(`${url}/api/v1/fbi-api/multiple`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      includeRelations: !!keys?.[0]?.includeRelations,
      profile: `${keys?.[0]?.profile.agency}-${keys?.[0]?.profile.name}`,
      ids: keys.map((entry) => entry.id),
    }),
    allowedErrorStatusCodes: [404],
  });

  return keys.map((k) => res?.body?.records?.[k.id]);
}

// Redis caching is enabled on a trial basis. If the large record objects put
// too much load on Redis, we must disable it and find another caching strategy.
export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
