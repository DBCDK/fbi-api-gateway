import config from "../config";

/**
 * set favorite pickup branch in userdata service
 */
export async function load({ smaugUserId, favoritePickUpBranch }, context) {
  const { url } = config.datasources.userdata;
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
    prefix: "userinfo",
  },
};
