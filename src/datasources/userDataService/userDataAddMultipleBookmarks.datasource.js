import config from "../../config";
const { url } = config.datasources.userdata;

/**
 * Add a bookmark to logged in user - return the Id
 *
 * bookmarks {materialType: string, materialId: string}
 */
export async function load({ smaugUserId, bookmarks }, context) {
  const endpoint = url + "bookmark/addMultiple";

  try {
    const bookmark = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ smaugUserId, bookmarks }),
    });
    return bookmark.body;
  } catch (e) {
    console.log(e, "ERROR");
  }
}
