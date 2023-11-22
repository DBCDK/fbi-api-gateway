import config from "../config";
import { accountsToCulr, getTestUser } from "../utils/testUserStore";

const { url, ttl, prefix } = config.datasources.userInfo;
/**
 * Fetch user info
 *
 * ?skipBorchk=1 param to skip Borchk
 */
export async function load({ accessToken }, context) {
  const res = await context?.fetch(`${url}?skipBorchk=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    allowedErrorStatusCodes: [401],
  });

  // TODO: Remove agency backfill from smaug, when userinfo supports loggedInAgencyId
  if (res.body?.attributes) {
    const smaug = await context.getLoader("smaug").load({
      accessToken,
    });

    return {
      attributes: {
        ...res.body.attributes,
        loggedInAgencyId: smaug?.user?.agency || null,
      },
    };
  }

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
      userId: loginAgency?.cpr || loginAgency?.localId,
      blocked: false,
      uniqueId: loginAgency?.uniqueId,
      agencies: accountsToCulr(testUser.merged),
      municipalityAgencyId: testUser.merged.find(
        (account) => account.isMunicipality
      )?.agency,
      loggedInAgencyId: loginAgency?.agencyId,
    },
  };
}

export const options = {
  redis: {
    prefix,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    ttl,
  },
};
