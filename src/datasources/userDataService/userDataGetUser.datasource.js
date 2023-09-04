import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * add a bookmark. Bookmark is a materialType + materialId
 */
export async function load({ smaugUserId }, context) {
  const endpoint = url + "user/get";

  const user = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId }),
  });

  return user.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
