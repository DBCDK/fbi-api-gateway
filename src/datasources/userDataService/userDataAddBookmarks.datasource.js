import config from "../../config";
const { url , teamLabel } = config.datasources.userdata;

/**
 * Add a bookmark to logged in user - return the Id
 *
 * bookmarks {materialType: string, materialId: string}
 */
export async function load({ uniqueId, bookmarks, agencyId }, context) {
  const endpoint = url + "bookmark/add";
  try {
    const res = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ smaugUserId: uniqueId, bookmarks, agencyId }),
    });

    return res.body;
  } catch (e) {
    console.error(e, "ERROR");
  }
}
