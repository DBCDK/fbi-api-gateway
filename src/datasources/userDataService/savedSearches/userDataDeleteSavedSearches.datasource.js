import config from "../../../config";
const { url, teamLabel } = config.datasources.userdata;

/**
 * Delete multiple advanced searches
 *
 * savedSearchIds list of ids to delete
 */
export async function load({ uniqueId, savedSearchIds }, context) {
  const endpoint = url + "advancedSearches";
  try {
    const res = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
      body: JSON.stringify({ smaugUserId: uniqueId, savedSearchIds }),
    });

    return res.body;
  } catch (e) {
    console.error(e, "ERROR");
  }
}

export { teamLabel };
