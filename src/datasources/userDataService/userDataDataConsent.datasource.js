import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Updates users preference to saving orders for more than 30 days
 */
export async function load({ smaugUserId, persistUserData }, context) {
  const endpoint = url + "user/persist-data-consent";
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify({ smaugUserId: smaugUserId, persistUserData }),
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
