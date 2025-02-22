/**
 * @file
 * Get holdingitems from http://holdings-items-content-service.cisterne.svc.cloud.dbc.dk/api/holdings-by-branch
 */

import config from "../../config";
const { teamLabel } = config.datasources.holdingsitems;

/**
 * NOTE - get request parameters eg. ?agencyId=710100&branchId=710117&pid=870970-katalog:25912233
 */
export async function load({ agencyId, pids }, context) {
  const url = config.datasources.holdingsitems.url;

  const response = await context.fetch(
    `${url}/holdings-by-pid?agency=${agencyId}${pids?.map((pid) => `&pid=${pid}`).join("")}`
  );

  const res = [];
  Object.values(response.body?.holdings || {})?.forEach((items) =>
    items?.forEach((item) => res?.push(item))
  );
  return res;
}

export const options = {
  redis: {
    prefix: "holdingsitems-1",
    ttl: 60 * 1, // cache for 1 minute
  },
};

export { teamLabel };
