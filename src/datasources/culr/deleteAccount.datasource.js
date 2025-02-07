/**
 * @file This datasource is used to retrieve a users agency accounts from CULR
 */

import config from "../../config";

const { url , teamLabel } = config.datasources.culr;

/**
 * Gets the CULR account information
 */
export async function load({ agencyId, userCredentials }, context) {
  const { accessToken } = context;

  const res = await context?.fetch(`${url}/deleteaccount/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agencyId, userCredentials }),
    allowedErrorStatusCodes: [],
  });

  return res.body;
}
