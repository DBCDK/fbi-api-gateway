import config from "../config";

/**
 * Fetch smaug configuration
 */
export async function load({ accessToken }, context) {
  const res = await context.fetch(
    `${config.datasources.smaug.url}/configuration?token=${accessToken}`,
    { allowedErrorStatusCodes: [404] }
  );

  return res.body;
}

export const options = {
  redis: {
    prefix: "smaug-1",
    ttl: 10, // 10 seconds
  },
};
