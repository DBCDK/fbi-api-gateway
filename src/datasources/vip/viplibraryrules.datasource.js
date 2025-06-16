import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.vipcore;

/**
 * Search for vip libraryrules using vip-core->libraryrules
 */
export async function load({ agencyId }, context) {
  const res = await context.fetch(url + "/libraryrules", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      agencyId: agencyId,
      libraryRule: [{ name: "regional_obligations", bool: true }],
    }),
    allowedErrorStatusCodes: [404],
  });

  return res?.body?.libraryRules;
}

export const options = {
  redis: {
    prefix: prefix + "_libraryrules",
    ttl,
  },
};

export { teamLabel };
