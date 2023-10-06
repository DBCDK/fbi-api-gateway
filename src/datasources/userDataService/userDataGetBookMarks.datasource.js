import config from "../../config";
const { url } = config.datasources.userdata;

/**
 * Fetch bookmarks for logged in user
 */
export async function load({ smaugUserId, limit, offset, orderBy }, context) {
  const endpoint = url + "bookmark/get";
  try {
    const bookmarks = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        smaugUserId: smaugUserId,
        limit,
        offset,
        orderBy,
      }),
    });
    console.log("\n\nbookmarks.body", bookmarks.body);
    return bookmarks.body;
  } catch (e) {
    console.log("\n\n\nERror ", e);
    // @TODO log
    return [];
  }
}
