import config from "../../config";
const { url } = config.datasources.userdata;

/**
 * Add a bookmark to logged in user - return the Id
 *
 * bookmarks {materialType: string, materialId: string}
 */
export async function load({ smaugUserId, bookmarks }, context) {
  const endpoint = url + "bookmark/add";
console.log('bookmarks',bookmarks)
console.log('endpoint',endpoint)
console.log('smaugUserId',smaugUserId)



  try {
    const res = await context.fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ smaugUserId, bookmarks }),
    });

    return res.body;
  } catch (e) {
    console.error(e, "ERROR");
  }
}
