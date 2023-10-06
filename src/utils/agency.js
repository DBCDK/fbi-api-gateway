import { getAccount } from "./culr";

/**
 * Function to check if an agencyId is a FFU library
 *
 * @param {string} agencyId
 * @returns boolean
 */

export function isFFUAgency(agencyId) {
  const LENGTH = 6;
  const list = ["4", "6", "8", "9"];
  return agencyId.length === LENGTH && list.includes(agencyId.charAt(0));
}

/**
 *
 * will delete a users relation to a FFU library. Deletes the library account in Culr.
 * @returns
 */
export const deleteFFUAccount = async ({
  agencyId,
  //localId,
  dryRun,
  context,
}) => {
  try {
    // settings
    const ENABLE_FFU_CHECK = true;

    // token is not authenticated - anonymous token used
    // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
    if (!context?.smaug?.user?.id) {
      return {
        status: "ERROR_UNAUTHENTICATED_TOKEN",
      };
    }

    // validate Agency
    if (ENABLE_FFU_CHECK && !isFFUAgency(agencyId)) {
      return {
        status: "ERROR_INVALID_AGENCY",
      };
    }

    // validate localId
    if (!localId || isCPRNumber(localId)) {
      return {
        status: "ERROR_INVALID_LOCALID",
      };
    }

    // Get token user accounts
    const account = await getAccount(context.accessToken, context, {
      agency: agencyId,
      type: "LOCAL",
    });

    if (!account) {
      return {
        status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
      };
    }

    // Check for dryRun
    if (dryRun) {
      return {
        status: "OK",
      };
    }

    // Get agencies informations from login.bib.dk /userinfo endpoint
    const response = await context.datasources
      .getLoader("culrDeleteAccount")
      .load({ agencyId, localId: account.userIdValue });

    // Response errors - account does not exist
    if (response.code === "ACCOUNT_DOES_NOT_EXIST") {
      return {
        status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
      };
    }

    // AgencyID
    if (response.code === "ILLEGAL_ARGUMENT") {
      return {
        status: "ERROR_AGENCYID_NOT_PERMITTED",
      };
    }

    if (response.code === "OK200") {
      return {
        status: "OK",
      };
    }

    return { status: "ERROR" };
  } catch (error) {
    return { status: "ERROR" };
  }
};
