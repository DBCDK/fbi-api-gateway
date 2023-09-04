/**
 * @file This is for the prototype, will likely be deleted soon
 */

import config from "../config";

const { url, prefix, ttl } = config.datasources.recommendations;

export async function load({ pid, limit = 10, profile, branchId }, context) {
  const body = {
    like: [pid],
    agencies: [profile.agency],
    persistent_work: true,
    profile: profile.name,
    limit,
  };

  if (branchId) {
    body.branchid = branchId;
  }

  console.log(body, "BODY");

  const fisk = await context.fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log(url, "URL");
  console.log(fisk, "FIS");
  return fisk.body;
}

/*export const options = {
  redis: {
    prefix,
    ttl,
  },
};*/
