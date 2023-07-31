import config from "../config";

/**
 * remove order in userdata service
 */
export async function load({ smaugUserId, orderId }, context) {
  const { url } = config.datasources.userdata;
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
    prefix: "userinfo",
  },
};
