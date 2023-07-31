import config from "../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Create new user in userdata service
 */
export async function load({ smaugUserId }, context) {
  const addUserEndpoint = url + "user/add";
  await context.fetch(addUserEndpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: smaugUserId }),
  });
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
