import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.userdata;

/**
 * set favorite pickup branch in userdata service
 */
export async function load({ uniqueId, favoritePickUpBranch }, context) {
  const endpoint = url + "user/favoritePickupBranch";
  const res = await context?.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      smaugUserId: uniqueId,
      favoritePickUpBranch,
    }),
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

export { teamLabel };
