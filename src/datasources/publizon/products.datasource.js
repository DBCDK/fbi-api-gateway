/**
 * @file This datasource is used to retrieve product details from publizon adapter (pubhup api)
 */

import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.publizon;

/**
 * Gets the holdings informations by recordid
 *
 * curl -H "Authorization: bearer {TOKEN}" -X GET https://pubhub-openplatform.dbc.dk/v1/products/
 *
 */
export async function load({ isbn }, context) {
  const accessToken = context?.accessToken;

  if (isbn) {
    const res = await context?.fetch(`${url}/v1/products/${isbn}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      allowedErrorStatusCodes: [],
    });

    if (res.status === 200) {
      return res?.body?.product || {};
    }
  }

  return null;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
