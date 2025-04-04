import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.vipcore;

/**
 * Search for vip agencies using vip-core->agencyinfo
 */
export async function load(args, context) {
  const res = await context.fetch(url + "/agencyinfo", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(args),
    allowedErrorStatusCodes: [404],
  });

  return res?.body;
}

export const options = {
  redis: {
    prefix: prefix + "_agencyinfo",
    ttl,
  },
};

export { teamLabel };
