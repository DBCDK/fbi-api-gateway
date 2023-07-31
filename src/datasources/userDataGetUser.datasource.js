import config from "../config";

/**
 * Fetch user data form userdata service
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
  const endpoint = url + "user/get";

  const user = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: smaugUserId }),
  });

  return user.body;
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
