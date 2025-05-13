/**
 * @file This datasource is used to retrieve holdings from fbs-cms adapter (cicero api)
 */

import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.cicero;

/**
 * Gets the holdings informations by recordid
 */
export async function load({ recordId, agencyId }, context) {
  console.log("........... datasource props", { recordId, agencyId, context });

  const accessToken = context?.accessToken;

  if (recordId && agencyId) {
    const res = await context?.fetch(
      `${url}/external/${agencyId}/catalog/holdings/v5?recordid=${recordId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        allowedErrorStatusCodes: [],
      }
    );

    console.log("######## res", res);

    if (res.status === 200) {
      const body = res.body?.[0] || {};

      return { ...body };
    }
  }

  return null;
}

// export const options = {
//   redis: {
//     prefix,
//     ttl,
//   },
// };

export { teamLabel };
