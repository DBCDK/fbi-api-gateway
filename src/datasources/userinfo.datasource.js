import config from "../config";

const { url, ttl, prefix } = config.datasources.userInfo;
/**
 * Fetch user info
 */
export async function load({ accessToken }, context) {
  const res = await context?.fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    allowedErrorStatusCodes: [401],
  });

  return res.body;
}

export const options = {
  redis: {
    prefix: prefix,
    ttl: ttl,
  },
};
