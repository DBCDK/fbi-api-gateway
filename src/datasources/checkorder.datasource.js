import config from "../config";
import { log } from "dbc-node-logger";

const { serviceRequester, url, ttl, prefix, teamLabel } =
  config.datasources.openorder;

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
    // REMOVE THIS AGAIN!!!!!!! driftissue fra 02/02-2024 - vores howru fjeler periodisk pga 503 fra checkorderpolicy  - undersøg hvorfor efter weekendden
    allowedErrorStatusCodes: [503],
  });

  if (policy?.status !== 200) {
    // This may be removed again. Used for debugging when checkorder fails
    // We stringify all in message, to avoid using precious kibana fields
    log.error(
      `checkorder error: ${JSON.stringify({
        req: { accessToken: accessToken, body: JSON.stringify(post) },
        res: { status: policy?.status, body: policy?.body },
      })}`
    );
  }

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

export { teamLabel };
