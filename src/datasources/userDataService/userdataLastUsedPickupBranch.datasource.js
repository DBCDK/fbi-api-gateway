import config from "../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * set last used pickup branch in userdata service
 */
export async function load({ uniqueId, lastUsedPickUpBranch }, context) {
  const endpoint = url + "user/lastUsedPickUpBranch";

  const res = await context?.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify({
      smaugUserId: uniqueId,
      lastUsedPickUpBranch,
    }),
  });

  if (res?.status !== 200) {
    throw new Error(
      res?.body?.error ||
        "Something went wrong in updating lastUsedPickUpBranch"
    );
  }
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
