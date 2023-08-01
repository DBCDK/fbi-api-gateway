import config from "../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Delete user from userdata service
 */
export async function load({ smaugUserId }, context) {
  const endpoint = url + "user";
  await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ smaugUserId: smaugUserId }),
  });
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
