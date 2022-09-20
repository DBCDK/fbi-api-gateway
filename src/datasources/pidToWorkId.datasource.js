/**
 * @file Mapping faust to manifestation id
 */

import config from "../config";

const { url } = config.datasources.work;

/**
 * Fetches a work id, based on a pid
 * Currently, we use the old work presentation service, maybe a dedicated service
 * is created at some point.
 */
export async function load({ pid, profile }, context) {
  const res = await context?.fetch(
    `${url}?workId=work-of:${pid}&agencyId=${profile.agency}=&profile=${profile.name}`
  );

  return (await res.json())?.work?.workId;
}
