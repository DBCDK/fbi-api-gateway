import config from "../config";
import isArray from "lodash/isArray";

const { serviceRequester, url, ttl, prefix } = config.datasources.openorder;

export async function load({ pids, pickupBranch, accessToken }, context) {
  const post = {
    pickUpAgencyId: pickupBranch,
    pid: pids,
    serviceRequester: serviceRequester,
  };

  const policy = await context.fetch(`${url}checkorderpolicy/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(post),
  });

  return policy?.body || null;
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */

// export async function status(loadFunc) {
//   await loadFunc({pid: "870970-basis:51877330", pickupBranch: "710100"});
// }

export const options = {
  redis: {
    prefix: prefix,
    ttl: ttl,
  },
};
