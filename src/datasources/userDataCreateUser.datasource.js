import config from "../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Create new user in userdata service
 */
export async function load({ smaugUserId }, context) {
  const addUserEndpoint = url + "user/add";
  const res = await context.fetch(addUserEndpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: smaugUserId }),
  });
  if (res?.status !== 200) {
    throw new Error(res?.body?.error || "Failed to create user");
  }
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
