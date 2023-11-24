import config from "../../config";
const { url } = config.datasources.userdata;

/**
 * Fetch bookmarks for logged in user
 */
export async function load({ uniqueId, orderBy }, context) {
  const endpoint = url + "bookmark/get";
  try {
    const bookmarks = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        smaugUserId: uniqueId,
        orderBy,
      }),
    });
    return bookmarks.body;
  } catch (e) {
    // @TODO log
    return [];
  }
}
