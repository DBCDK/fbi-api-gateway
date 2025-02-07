/**
 * @file
 * update holdingsItems
 */

import { log } from "dbc-node-logger";
import config from "../../config";
import { buildPath } from "./utils";

const url = config.datasources.holdingsitems2.url;
const { teamLabel } = config.datasources.holdingsitems2;

/**
 *
 * funktion to update all items in a bibliographicRecord or a single item
 *
 * @param {object} props
 * @param {string} props.agencyId
 * @param {string} props.bibliographicRecordId
 * @param {string} props.itemId
 * @param {string} props.trackingId
 * @param {object} context
 * @returns {object}
 */
export async function load(props, context) {
  const { data } = props;

  // build underlaying service url with path and query params
  const path = buildPath(url, props);

  const res = await context?.fetch(path, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify(data),
    allowedErrorStatusCodes: [404, 400],
  });

  return {
    // fallback
    ok: false,
    message: "unknown error occured",

    // service status
    status: res.status === 200 ? "OK" : "ERROR",
    ...res?.body,
  };
}
