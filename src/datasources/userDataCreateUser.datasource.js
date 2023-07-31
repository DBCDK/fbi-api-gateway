import config from "../config";

/**
 * Create new user in userdata service
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
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
    prefix: "userinfo",
  },
};
