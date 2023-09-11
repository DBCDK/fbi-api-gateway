import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * delete a bookmark for logged in user
 */
export async function load({ smaugUserId, bookmarkId }, context) {
  const endpoint = url + "bookmark/delete";
  try {
    const deleteresult = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
      body: JSON.stringify({ smaugUserId, bookmarkId }),
    });

    return deleteresult.body.bookmarkId;
  } catch (e) {
    // @TODO log
    return [];
  }
}
