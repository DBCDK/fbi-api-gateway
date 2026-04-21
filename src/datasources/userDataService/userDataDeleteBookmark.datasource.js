import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.userdata;

/**
 * delete a bookmark for logged in user
 */
export async function load(
  { uniqueId, bookmarkIds, agencyId, key, application },
  context
) {
  const endpoint = url + "bookmark/delete";
  try {
    const deleteresult = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
      body: JSON.stringify({
        smaugUserId: uniqueId,
        bookmarkIds,
        agencyId,
        key,
        application,
      }),
    });
    return { IdsDeletedCount: deleteresult.body.IdsDeleted };
  } catch (e) {
    // @TODO log
    return [];
  }
}

export { teamLabel };
