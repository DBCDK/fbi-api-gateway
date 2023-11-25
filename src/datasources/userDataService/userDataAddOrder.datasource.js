import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Add order in userdata service
 */
export async function load({ uniqueId, orderId }, context) {
  const endpoint = url + "order/add";
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: uniqueId, orderId: orderId }),
  });

  if (res?.status !== 200) {
    throw new Error(res?.body?.error || "Something went wrong.");
  }
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
