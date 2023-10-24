import config from "../config";
import { getTestUser } from "../utils/testUserStore";

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

/*
 * Simulate a user by creating a fake uniqueId associated with the access token
 */
export async function testLoad({ accessToken }, context) {
  // We still want to load smaug configuration from the real smaug
  const configuration = await load({ accessToken }, context);

  if (configuration) {
    const testUser = await getTestUser(context);
    configuration.user = {
      uniqueId: testUser.loginAgency.uniqueId,
      id: testUser.loginAgency.cpr,
      agencyId: testUser.loginAgency.agency,
    };
  }

  return configuration;
}

export const options = {
  redis: {
    prefix: "smaug-1",
    ttl: 10, // 10 seconds
  },
};
