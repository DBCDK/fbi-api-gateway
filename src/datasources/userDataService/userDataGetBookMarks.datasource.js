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
    return bookmarks.body;
  } catch (e) {
    // @TODO log
    return [];
  }
}
