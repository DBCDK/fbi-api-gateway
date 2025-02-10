/**
 * @file This is for the prototype, will likely be deleted soon
 */

import config from "../config";

const { url, prefix, ttl, teamLabel } = config.datasources.recommendations;

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

  const response = await context.fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return response?.body;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
