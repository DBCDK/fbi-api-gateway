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
    limit,
  };

  if (branchId) {
    body.branchid = branchId;
  }

  console.log("fffffffffffff", JSON.stringify(body));

  return (
    await context.fetch(url, { method: "POST", body: JSON.stringify(body) })
  ).body;
}

// export const options = {
//   redis: {
//     prefix,
//     ttl,
//   },
// };
