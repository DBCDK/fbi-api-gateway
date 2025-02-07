import config from "../config";
import { hasCulrDataSync, getAgencyIdByBranchId } from "../utils/agency";
import { setMunicipalityAgencyId } from "../utils/municipalityAgencyId";
import { omitUserinfoCulrData } from "../utils/omitCulrData";
import { accountsToCulr, getTestUser } from "../utils/testUserStore";

const { url, ttl, prefix, teamLabel } = config.datasources.userInfo;
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

    const idpUsed = res.body?.attributes?.idpUsed;

    // Set loggedInBranchId (Former loggedInAgencyId)
    const loggedInBranchId =
      idpUsed === "nemlogin" && !smaug?.user?.agency
        ? "190101"
        : smaug?.user?.agency || null;

    // user attributes enriched with loggedInBranchId (from smaug)
    let attributes = {
      ...res.body?.attributes,
      loggedInBranchId,
      loggedInAgencyId: null,
    };

    // The Smaug "agency" field can now hold both agencyIds and branchIds. Therefore, we ensure that loggedInAgencyId always contains an agencyId.
    // The loggedInBranchId will always contain a branchId, which can also be an agencyId (e.g., main libraries).
    // If branch act as independent, branchId will be set in both loggedInAgencyId and loggedInBranchId
    attributes.loggedInAgencyId = await getAgencyIdByBranchId(
      loggedInBranchId,
      context
    );

    // This check prevents FFU users from accessing CULR data.
    // FFU Borchk authentication, is not safe enough to expose CULR data.
    const loggedInId = loggedInBranchId || attributes?.loggedInAgencyId;

    // If no uniqueId was found for the user, we check with culr, if a user was found on the agencyId instead
    // BIBDK connected FFU users, exist in Culr with agencyId only. The bibdk provided id for /userinfo will be an branchId.
    if (!attributes.uniqueId) {
      // Retrieve user culr account
      const response = await context
        .getLoader("culrGetAccountsByLocalId")
        .load({
          userId: attributes.userId,
          agencyId: attributes.loggedInAgencyId,
        });

      if (response?.omittedCulrData) {
        attributes.omittedCulrData = response?.omittedCulrData;
      }
    }

    //  Only relevant if user exist in CULR
    if (attributes.uniqueId) {
      // User exist in CULR
      if (!(await hasCulrDataSync(loggedInId, context))) {
        // User is signediIn with a library which does NOT sync data with CULR - CULR Data is omitted
        attributes = omitUserinfoCulrData(attributes);
      }
    }

    // Fixes that folk bib users with associated FFU Accounts overrides users municipalityAgencyId with FFU agencyId
    const municipalityAgencyId = await setMunicipalityAgencyId(
      attributes,
      context
    );

    // user data object
    return {
      attributes: {
        ...attributes,
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
  // if provided accessToken differs from context.accesstoken (bearer token)
  // Fetch user from provided accessToken
  const optionalToken = context.accessToken !== accessToken && accessToken;
  const testUser = await getTestUser(context, optionalToken);
  const loginAgency = testUser?.loginAgency;
  const idpUsed = testUser?.loginAgency?.idpUsed;
  const map = { 911116: "1110" };

  const loggedInAgencyHasCulrDataSync = await hasCulrDataSync(
    loginAgency?.agency,
    context
  );

  const municipalityAgencyId = testUser.merged.find(
    (account) => account.isMunicipality
  )?.agency;

  let attributes = {
    idpUsed,
    userId: loginAgency?.cpr || loginAgency?.localId,
    blocked: false,
    uniqueId: loggedInAgencyHasCulrDataSync ? loginAgency?.uniqueId : null,
    agencies: accountsToCulr(testUser.merged)?.filter(
      (account) => account.agencyId !== "190101"
    ),
    municipalityAgencyId,
    municipality: municipalityAgencyId?.startsWith?.("7")
      ? municipalityAgencyId?.substr?.(1, 3)
      : map[municipalityAgencyId],
    loggedInAgencyId: null,
    loggedInBranchId: loginAgency?.agency,
  };

  // The Smaug "agency" field can now hold both agencyIds and branchIds. Therefore, we ensure that loggedInAgencyId always contains an agencyId.
  // The loggedInBranchId will always contain a branchId, which can also be an agencyId (e.g., main libraries).
  // If branch act as independent, branchId will be set in both loggedInAgencyId and loggedInBranchId
  attributes.loggedInAgencyId = await getAgencyIdByBranchId(
    attributes.loggedInBranchId,
    context
  );

  //  Only relevant if user exist in CULR
  if (attributes.uniqueId) {
    // User exist in CULR
    if (!loggedInAgencyHasCulrDataSync) {
      // User is signediIn with a library which does NOT sync data with CULR - CULR Data is omitted
      attributes = omitUserinfoCulrData(attributes);
    }
  }

  return { attributes };
}

export const options = {
  external: true,
  redis: {
    prefix,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    ttl,
  },
};

export { teamLabel };
