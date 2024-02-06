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

// @TODO 29/12/23  .. disable/overwrite howru for this datasource for now - we know the service is failing now and then
// DOUBLE @TODO find out why - problems started 29/12/23 9.47 and continued .. pidToWork foiled, but we could not find out
// why
//
export function status() {
  return true;
  /*if (!isConnected) {
    throw new Error("Redis is not connected");
  }*/
}

export const options = {
  redis: {
    prefix: `pidtowork-${prefix}`,
    ttl,
  },
};
