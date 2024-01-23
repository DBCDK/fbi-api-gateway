import config from "../config";
import { log } from "dbc-node-logger";

const { url, prefix, ttl } = config.datasources.jed;

/**
 * Fetches a work id, based on a pid
 * Currently, we use the old work presentation service, maybe a dedicated service
 * is created at some point.
 */
export async function load({ pid, profile }, context) {
  const res = await context.fetch(
    `${url}/api/v1/fbi-api/manifestation?id=${pid}&profile=${profile.agency}-${profile.name}&includeRelations=false`,
    { allowedErrorStatusCodes: [404] }
  );
  // log if not ok - @TODO a more generic way? - may for all datasources
  if (res?.status !== 200) {
    log.error(`pidToWorkId returns wrong statuscode:${res?.status}`, {
      pid: pid,
      profile: profile,
    });
  }

  return res.body?.workId;
}

export const options = {
  redis: {
    prefix: `pidtowork-${prefix}`,
    ttl,
  },
};
