import config from "../config";

const { url, prefix, teamLabel } = config.datasources.fbiinfo;

export async function load(pid, context) {
  const res = await context?.fetch(`${url}/resource/${pid}/forside`, {
    allowedErrorStatusCodes: [404],
  });

  return res?.body;
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 60, // 1 hour
    staleWhileRevalidate: 60 * 60 * 12, // 12 hours
  },
};

export { teamLabel };
