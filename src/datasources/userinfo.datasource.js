import config from "../config";
import { setMunicipalityAgencyId } from "../utils/municipalityAgencyId";
import { accountsToCulr, getTestUser } from "../utils/testUserStore";

const { url, ttl, prefix } = config.datasources.userInfo;
/**
 * Fetch user info
 *
 */
export async function load({ accessToken }, context) {
  const res = await context?.fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    allowedErrorStatusCodes: [401],
  });

  // TODO: Remove agency backfill from smaug, when userinfo supports loggedInAgencyId
  if (res.body?.attributes) {
    const smaug = await context.getLoader("smaug").load({
      accessToken,
    });

    // Fixes that folk bib users with associated FFU Accounts overrides users municipalityAgencyId with FFU agencyId
    const municipalityAgencyId = setMunicipalityAgencyId(res.body?.attributes);

    return {
      attributes: {
        ...res.body.attributes,
        loggedInAgencyId: smaug?.user?.agency || null,
        municipalityAgencyId,
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

  const map = { 911116: "1110" };

  const municipalityAgencyId = testUser.merged.find(
    (account) => account.isMunicipality
  )?.agency;

  return {
    attributes: {
      userId: loginAgency?.cpr || loginAgency?.localId,
      blocked: false,
      uniqueId: loginAgency?.uniqueId,
      agencies: accountsToCulr(testUser.merged)?.filter(
        (account) => account.agencyId !== "190101"
      ),
      municipalityAgencyId,
      municipality: municipalityAgencyId?.startsWith?.("7")
        ? municipalityAgencyId?.substr?.(1, 3)
        : map[municipalityAgencyId],
      loggedInAgencyId: loginAgency?.agency,
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
