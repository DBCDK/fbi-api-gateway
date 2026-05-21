/**
 * @file
 * Retrieve holdingsItems for a bibliographic record
 */

import config from "../../config";
import { buildPath } from "./utils";

const url = config.datasources.holdingsitems2.url;
const teamLabel = config.datasources.holdingsitems2.teamLabel;

/**
 *
 * Function to retrieve all items in a bibliographicRecord
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
    method: "GET",
    allowedErrorStatusCodes: [404, 400],
  });

  return {
    ok: false,
    message: "unknown error occured",
    status: res.status === 200 ? "OK" : "ERROR",
    ...res?.body,
  };
}

export { teamLabel };
