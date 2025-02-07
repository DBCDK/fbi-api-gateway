import config from "../../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.userdata;

/**
 * Update a savedSearch by savedSearch id.
 */
export async function load({ uniqueId, searchObject, savedSearchId }, context) {
  const endpoint = url + "advancedSearches/update/" + savedSearchId;

  const user = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ smaugUserId: uniqueId, searchObject }),
  });
  return user.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};

export { teamLabel };
