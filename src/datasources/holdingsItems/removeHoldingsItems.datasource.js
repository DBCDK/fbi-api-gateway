/**
 * @file
 * Delete a bibliographicRecord and all items
 */

import config from "../../config";
import { buildPath } from "./utils";

//   const url = config.datasources.holdingsitems.url;

const url =
  "http://holdings-items-2-service.fbstest.svc.cloud.dbc.dk/api/v1/holdings";

/**
 *
 * funktion to update all items in a bibliographicRecord or a single item
 *
 * @param {object} props
 * @param {string} props.agencyId
 * @param {string} props.bibliographicRecordId
 * @param {string} props.trackingId
 * @param {object} context
 * @returns {object}
 */
export async function load(props, context) {
  const path = buildPath(url, props);

  const res = await context?.fetch(path, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    allowedErrorStatusCodes: [404, 400],
  });

  return {
    ...res.body,
    status: res.status === 200 ? "OK" : "ERROR",
  };
}

// export const options = {
//   redis: {
//     prefix: "holdingsitems-1",
//     ttl: 60 * 15, // cache for 15 minutes
//   },
// };
