import config from "../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * set favorite pickup branch in userdata service
 */
export async function load({ smaugUserId, favoritePickUpBranch }, context) {
  const endpoint = url + "user/favoritePickupBranch";
  await context?.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      smaugUserId: smaugUserId,
      favoritePickUpBranch: favoritePickUpBranch,
    }),
  });
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
