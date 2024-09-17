/**
 * @file This datasource is used to retrieve a users agency accounts from CULR
 */

import config from "../../config";

const { url } = config.datasources.culr;

/**
 * Gets the CULR account information
 */
export async function load({ agencyId }, context) {
  const { accessToken } = context;

  const res = await context?.fetch(`${url}/deleteallaccountsfromprovider/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agencyId }),
  });

  return res.body;
}
