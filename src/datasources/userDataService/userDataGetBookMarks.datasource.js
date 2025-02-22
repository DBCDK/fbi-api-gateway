import config from "../../config";
const { url, teamLabel } = config.datasources.userdata;

// Map OrderBy from ENUM to service field name
const mapOrderBy = { CREATEDAT: "createdAt", TITLE: "title" };

/**
 * Fetch bookmarks for logged in user
 */
export async function load({ uniqueId, orderBy, agencyId }, context) {
  const endpoint = url + "bookmark/get";
  try {
    const bookmarks = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        smaugUserId: uniqueId,
        orderBy: mapOrderBy[orderBy],
        agencyId: agencyId,
      }),
    });
    return bookmarks.body;
  } catch (e) {
    // @TODO log
    return [];
  }
}

export { teamLabel };
