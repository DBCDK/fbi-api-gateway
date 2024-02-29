import config from "../config";
import { hasCulrDataSync, isFFUAgency } from "../utils/agency";
import { setMunicipalityAgencyId } from "../utils/municipalityAgencyId";
import { omitUserinfoCulrData } from "../utils/omitCulrData";
import replaceBranchIdWithAgencyId from "../utils/replaceBranchIdWithAgencyId";
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

    const idpUsed = res.body?.attributes?.idpUsed;

    const loggedInAgencyId =
      idpUsed === "nemlogin" && !smaug?.user?.agency
        ? "190101"
        : smaug?.user?.agency || null;

    // user attributes enriched with loggedInAgencyId (from smaug)
    let attributes = {
      ...res.body?.attributes,
      loggedInAgencyId,
      // loggedInBranchId: null,
    };

    // *** DISABLED FOR NOW ***
    // For FFU libraries the /userinfo and smaug fields can now hold both an agencyIds and branchIds
    // Therefore all used fields which contains branchIds will be replaced with an agencyId
    if (false && isFFUAgency(loggedInAgencyId, context)) {
      attributes = await replaceBranchIdWithAgencyId(attributes, context);
    }

    // This check prevents FFU users from accessing CULR data.
    // FFU Borchk authentication, is not safe enough to expose CULR data.
    if (!(await hasCulrDataSync(attributes?.loggedInAgencyId, context))) {
      attributes = omitUserinfoCulrData(attributes);
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
    loggedInAgencyId: loginAgency?.agency,
  };

  // *** DISABLED FOR NOW ***
  // For FFU libraries the /userinfo and smaug fields can now hold both an agencyIds and branchIds
  // Therefore all used fields which contains branchIds will be replaced with an agencyId
  if (false && isFFUAgency(loginAgency?.agency, context)) {
    attributes = await replaceBranchIdWithAgencyId(attributes, context);
  }

  // This check prevents FFU users from accessing CULR data.
  // FFU Borchk authentication, is not safe enough to expose CULR data.
  if (!loggedInAgencyHasCulrDataSync) {
    attributes = omitUserinfoCulrData(attributes);
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
