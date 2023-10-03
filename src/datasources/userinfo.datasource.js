import config from "../config";
import { getAccountsByLocalId } from "../utils/redisTestCulr";

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
  const branch = (
    await context.getLoader("library").load({
      branchId: context.testUser.loginAgency,
      status: "ALLE",
    })
  ).result[0];
  const agencyId = branch.agencyId;
  const localId = "123456";
  let patron = await getAccountsByLocalId({ agencyId, localId }, context);

  return {
    attributes: {
      userId: "0101011234",
      blocked: false,
      uniqueId: context?.smaug?.user?.uniqueId,
      agencies: patron.accounts.map((account) => ({
        agencyId: account.agencyId,
        userId: account.userIdValue,
        userIdType: account.userIdType,
      })),
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
