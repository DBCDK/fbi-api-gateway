/**
 * @file
 * Get holdingitems from http://holdings-items-content-service.cisterne.svc.cloud.dbc.dk/api/holdings-by-branch
 */

import { log } from "dbc-node-logger";
import config from "../../config";

const { teamLabel } = config.datasources.holdingsitems;

/**
 * NOTE - get request parameters eg. ?agencyId=710100&branchId=710117&pid=870970-katalog:25912233
 */
export async function load({ agencyId, branchId, pids }, context) {
  const url = config.datasources.holdingsitems.url;
  try {
    const queryParams = new URLSearchParams({
      agencyId,
      branchId,
      pid: pids,
    });

    const response = await context.fetch(
      `${url}/holdings-by-branch?${queryParams}`
    );
    return await response.body;
  } catch (e) {
    log.error("Request to holdingsitems failed." + " Message: " + e.message);
    console.log(e, "ERROR");
    // @TODO what to return here
  }
}

export const options = {
  redis: {
    prefix: "holdingsitems-1",
    ttl: 60 * 15, // cache for 15 minutes
  },
};

export { teamLabel };
