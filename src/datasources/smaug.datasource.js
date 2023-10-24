import config from "../config";
import { getTestUser, parseTestToken } from "../utils/testUserStore";

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
  const parsedTestToken =
    accessToken.startsWith("test") && parseTestToken(accessToken);

  accessToken = parsedTestToken?.accessToken || accessToken;

  // We still want to load smaug configuration from the real smaug
  const configuration = await load({ accessToken }, context);

  if (configuration) {
    const testUser = await getTestUser(
      parsedTestToken ? { ...context, ...parsedTestToken } : context
    );
    configuration.user = {
      uniqueId: testUser.loginAgency.uniqueId,
      id: testUser.loginAgency.cpr || testUser.loginAgency.localId,
      agencyId: testUser.loginAgency.agency,
      agency: testUser.loginAgency.agency,
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
