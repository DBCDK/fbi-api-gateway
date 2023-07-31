import config from "../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * remove order in userdata service
 */
export async function load({ smaugUserId, orderId }, context) {
  const endpoint = url + "user/order";
  await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ smaugUserId: smaugUserId, orderId: orderId }),
  });
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
