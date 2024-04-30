import config from "../../../config";
const { url, ttl, prefix } = config.datasources.userdata;

/**
 * Fetch saved searches for a user from userdata service
 */
export async function load({ uniqueId, limit, offset }, context) {
  console.log("\n\n\n\n\nuniqueId", { uniqueId, limit, offset });

  const endpoint = url + "advancedSearches/get";
  console.log("\n\n\n\n\nuniqueId", { uniqueId, limit, offset, url });

  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ smaugUserId: uniqueId, limit, offset }),
  });
  return res.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};
