import config from "../../config";

const { url, ttl, prefix } = config.datasources.vipcore;

/**
 * Search for vip agencies using vip-core->agencyinfo
 */
export async function load({ agencyId, profileName }, context) {
  const res = await context.fetch(url + "/opensearchprofile", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ agencyId, profileName, profileVersion: 3 }),
  });

  return res?.body;
}

export const options = {
  redis: {
    prefix: prefix + "_searchprofiles",
    ttl,
  },
};
