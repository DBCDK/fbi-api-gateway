/**
 * @file
 * Get holdingitems from http://holdings-items-content-service.cisterne.svc.cloud.dbc.dk/api/holdings-by-branch
 */

import config from "../../config";

/**
 * NOTE - get request parameters eg. ?agencyId=710100&branchId=710117&pid=870970-katalog:25912233
 */
export async function load({ agencyId, recordId, itemId }, context) {
  //   const url = config.datasources.holdingsitems.url;
  const url =
    "http://holdings-items-2-service.fbstest.svc.cloud.dbc.dk/api/v1/holdings";

  const res = await context?.fetch(`${url}/${agencyId}/${recordId}`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify({
      smaugUserId: uniqueId,
      lastUsedPickUpBranch,
    }),
  });

  return res.body;
}

// export const options = {
//   redis: {
//     prefix: "holdingsitems-1",
//     ttl: 60 * 15, // cache for 15 minutes
//   },
// };
