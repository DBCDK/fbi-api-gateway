import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Fetch user data form userdata service
 */
export async function load({ smaugUserId, materialType, materialId }, context) {
  const endpoint = url + "bookmark/add";

  console.log("FISKEHEST");

  const user = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId, materialType, materialId }),
  });

  console.log(user.body);
  return user.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
