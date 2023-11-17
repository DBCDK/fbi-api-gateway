import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Fetch orders for a user from userdata service
 */
export async function load({ uniqueId, limit, offset }, context) {
  const endpoint = url + "order/get";

  const user = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: uniqueId, limit, offset }),
  });
  return user.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
