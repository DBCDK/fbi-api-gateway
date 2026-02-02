import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.userdata;

/**
 * delete a bookmark for logged in user
 */
export async function load({ uniqueId, bookmarkIds }, context) {
  const endpoint = url + "bookmark/delete";
  try {
    const deleteresult = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
      body: JSON.stringify({ smaugUserId: uniqueId, bookmarkIds }),
    });
    return { idsDeletedCount: deleteresult.body.IdsDeleted };
  } catch (e) {
    // @TODO log
    return [];
  }
}

export { teamLabel };
