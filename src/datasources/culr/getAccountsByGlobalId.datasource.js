/**
 * @file This datasource is used to retrieve a users agency accounts from CULR
 */

import config from "../../config";

const { url, teamLabel } = config.datasources.culr;

/**
 * Gets the CULR account information
 */
export async function load({ userCredentials }, context) {
  const { accessToken } = context;

  const res = await context?.fetch(`${url}/getaccountsbyglobalid/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userCredentials }),
    allowedErrorStatusCodes: [],
  });

  return res.body;
}

export { teamLabel };
