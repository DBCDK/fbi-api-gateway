import config from "../config";

/**
 * Delete user from userdata service
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
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
    prefix: "userinfo",
  },
};
