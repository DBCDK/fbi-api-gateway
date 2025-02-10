import config from "../../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.userdata;

/**
 * Fetch saved search by cql
 */
export async function load({ uniqueId, cql }, context) {
  const endpoint = url + "advancedSearches/get/by-cql";

  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: uniqueId, cql }),
    allowedErrorStatusCodes: [404],
  });
  return res.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};

export { teamLabel };
