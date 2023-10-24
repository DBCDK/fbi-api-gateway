import config from "../config";
import { accountsToCulr, getTestUser } from "../utils/testUserStore";

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

/**
 *
 */
export async function testLoad({ accessToken }, context) {
  const testUser = await getTestUser(context);
  const loginAgency = testUser?.loginAgency;
  return {
    attributes: {
      userId: loginAgency.cpr || loginAgency.localId,
      blocked: false,
      uniqueId: loginAgency?.uniqueId,
      agencies: accountsToCulr(testUser.merged),
      municipalityAgencyId: "715100",
    },
  };
}

export const options = {
  redis: {
    prefix: prefix,
    ttl: ttl,
  },
};
