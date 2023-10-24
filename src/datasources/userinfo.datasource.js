import config from "../config";
import { getTestUser } from "../utils/testUserStore";

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
      agencies: testUser.culrAgencies,
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
