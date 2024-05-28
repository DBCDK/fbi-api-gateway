import config from "../../../config";
const { url } = config.datasources.userdata;

/**
 * Adds a saved search to user
 *
 * searchObject: stringified json object
 */
export async function load({ uniqueId, searchObject }, context) {
  const endpoint = url + "advancedSearches/add";
  try {
    const res = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ smaugUserId: uniqueId, searchObject }),
    });

    return res.body;
  } catch (e) {
    console.error(e, "ERROR");
  }
}
