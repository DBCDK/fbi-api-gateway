import config from "../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Fetch users order form userdata service
 */
export async function load({ smaugUserId, limit, offset }, context) {
  const endpoint = url + "order/get";

  const user = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: smaugUserId, limit, offset }),
  });
  return user.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
