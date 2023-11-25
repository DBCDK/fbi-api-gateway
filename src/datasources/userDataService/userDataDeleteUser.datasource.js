import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Delete user from userdata service
 */
export async function load({ uniqueId }, context) {
  const endpoint = url + "user";
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ smaugUserId: uniqueId }),
  });

  if (res?.status !== 200) {
    throw new Error(res?.body?.error || "Something went wrong");
  }
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
