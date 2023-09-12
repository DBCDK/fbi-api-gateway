import config from "../../config";
const { url } = config.datasources.userdata;

/**
 * Add a bookmark to logged in user - return the Id
 */
export async function load({ smaugUserId, materialType, materialId }, context) {
  const endpoint = url + "bookmark/add";

  try {
    const bookmark = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ smaugUserId, materialType, materialId }),
    });
    return bookmark.body;
  } catch (e) {
    console.log(e, "ERROR");
  }
}
