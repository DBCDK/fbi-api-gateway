import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.vipcore;

export async function load(agencyId, context) {
  const res = await context?.fetch(`${url}/requestorder/${agencyId}/`, {
    allowedErrorStatusCodes: [404],
  });

  return res?.body;
}

export const options = {
  redis: {
    prefix: prefix + "_requestorder-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};

export { teamLabel };
