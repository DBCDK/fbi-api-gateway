import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.userdata;

/**
 * remove order in userdata service
 */
export async function load({ uniqueId, orderId }, context) {
  const endpoint = url + "order";
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ smaugUserId: uniqueId, orderId: orderId }),
  });

  if (res?.status !== 200) {
    return { error: res?.body?.error };
  }
  return { status: res.status };
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};

export { teamLabel };
