/**
 * @file
 *
 *  Util function to verify if user is allowed to place an order
 *  Checks if user is blocked and exist on the provided agency
 *
 */

import isEmpty from "lodash/isEmpty";
import { log } from "dbc-node-logger";

import { resolveBorrowerCheck } from "./utils";

// all possible id field types
export const USER_ID_TYPES = ["cpr", "userId", "cardno", "customId", "barcode"];

// Some agencies (Currently reindex FFU libraries) are omitted in this check during to some borchk pincode issues.
const omittedAgencies = ["861160"];

/**
 * Verify if user is allowed to place an digital or physical order
 *
 * Why this check?
 * FFU libraries will not sync automatically with the CULR service,
 * unlike the public libraries. This will result in old user accounts
 * not being automatically removed from CULR.

 * Verify that user account is NOT blocked
 *
 * Why this check?
 * Now, a 'pickupbranch' is not associated with the agency where the
 * logged-in user is currently signed in. Therefore, it's necessary
 * to verify whether the user is blocked before placing an order.
 * 
 * @param {string} props.userId context
 * @param {string} props.agencyId context
 * @param {string} props.userPincode context
 * @param {obj} context context
 * 
 * @returns {obj} containing status, userId and statusCode
 * 
 * statusCodes:
 * 
 * OK
 * UNKNOWN_USER
 * BORCHK_USER_BLOCKED_BY_AGENCY
 * BORCHK_USER_NO_LONGER_EXIST_ON_AGENCY
 * BORCHK_USER_NOT_VERIFIED
 *  
 */
export default async function getUserBorrowerStatus(props, context) {
  const result = await userBorrowerStatus(props, context);

  // uncomment to debug
  // console.debug("....... BorrowerStatus", result);

  const status = result?.status;
  const message = status ? "allowed" : "NOT allowed";

  log.info(
    `BorrowerStatus: User ${message} to placed an order. ${JSON.stringify(
      result
    )}`
  );

  return result;
}

/**
 * Handle anonymous token users - where credentials is given as query arguments
 *
 * @param {string} props.agencyId
 * @param {object} props.userIds
 * @param {string} props.userPincode
 * @param {object} context
 * @returns {object}
 */
async function userBorrowerStatus(
  { agencyId, userIds = null, userPincode = null },
  context
) {
  // Summary log
  const summary = { agencyId, userIds };

  // An agencyId must be provided
  if (!agencyId) {
    return { status: false, statusCode: "UNKNOWN_PICKUPAGENCY" };
  }

  // Authenticated or anonymous order
  const isAuthenticated = !!context?.user?.userId;

  // add to summary log
  summary.isAuthenticated = isAuthenticated;

  // Verify that the agencyId has borrowerCheck
  // If NOT, No checks can be performed. We let the user place the order.
  const hasBorrowerCheck = await resolveBorrowerCheck(agencyId, context);

  // add to summary log
  summary.hasBorrowerCheck = hasBorrowerCheck;

  // AgencyId is omitted from the check
  const isOmittedAgency = omittedAgencies.includes(agencyId);

  // add to summary log
  summary.isOmittedAgency = isOmittedAgency;

  if (!hasBorrowerCheck || isOmittedAgency) {
    // Verification possible in openorder
    const status = !!(isAuthenticated || !isEmpty(userIds));

    // Agency does not support borrowercheck - return status ok
    return {
      status,
      summary,
      statusCode: status ? "OK" : "UNKNOWN_USER",
    };
  }

  // AgencyId has Borrowercheck, continue the order verification

  if (isAuthenticated) {
    const authResult = await authUserBorrowerStatus(
      { agencyId, userPincode },
      context
    );

    if (authResult?.statusCode) {
      return {
        ...authResult,
        summary: { ...summary, ...authResult?.summary },
      };
    }
  }

  // If user is NOT Authenticated! We check the provided userIds
  const anonResult = await anonUserBorrowerStatus(
    { agencyId, userIds },
    context
  );

  if (anonResult?.statusCode) {
    return {
      ...anonResult,
      summary,
    };
  }

  // No result was found
  return {
    status: false,
    statusCode: "UNKNOWN_USER",
    summary,
  };
}

/**
 * Handle authenticated token users - where credentials is fetched from token user
 *
 * @param {string} props.agencyId
 * @param {object} props.userIds
 * @param {object} context
 * @returns {object}
 */
async function authUserBorrowerStatus({ agencyId, userPincode }, context) {
  // summary object
  const summary = {};

  // userId may changes (let)
  let _userId;

  // UserId fetched from other account than loggedIn account
  let _isAccount;

  const user = context?.user;

  // Check if the user is authenticated on the provided agencyId
  const verifiedOnAgencyId = !!(
    user?.userId && user?.loggedInAgencyId === agencyId
  );

  // add to summary log
  summary.verifiedOnAgencyId = verifiedOnAgencyId;

  // If so, we check if the user is allowed to place an order here.
  if (verifiedOnAgencyId) {
    _userId = user?.userId;
  }
  // If NOT, we fetch the authenticated users other accounts
  // User may have placed an order to a different account/agency, than they orignally signed-in at.
  else {
    // user account list
    const accounts = user?.agencies;

    // fetch requested account from list
    // Local (type) account is preferred, because it will always exist
    const account = accounts?.find(
      (a) => a.agencyId === agencyId && a.userIdType === "LOCAL"
    );

    // Update internal userId
    // If an userinfo account was found, we use the userId credential from the matching local account
    // If NOT we use the provided userId (used for sessional orders) - fallbacks to login.bib.dk id if none provided
    if (account) {
      _userId = account?.userId;
      _isAccount = true;

      // add to summary log
      summary.fromOtherUserAccount = true;
    }
  }

  // Check authenticated user
  const result = await checkUserBorrowerStatus(
    { agencyId, userId: _userId, userPincode, isAccount: _isAccount },
    context
  );

  // enrich response with the access given userId
  return {
    status: result.status,
    statusCode: result.statusCode,
    userId: _userId,
    summary,
  };
}

/**
 * Handle anonymous token users - where credentials is given as query arguments
 *
 * @param {string} props.agencyId
 * @param {object} props.userIds
 * @param {object} context
 * @returns {object}
 */
async function anonUserBorrowerStatus({ agencyId, userIds }, context) {
  // if no userIds was provided, no check can be performed
  if (!userIds) {
    return {
      status: false,
      statusCode: "UNKNOWN_USER",
    };
  }

  // Check all the provided userIds
  const statusMap = await Promise.all(
    Object.entries(userIds).map(async ([k, v]) => ({
      ...(await checkUserBorrowerStatus({ agencyId, userId: v }, context)),
      type: k,
    }))
  );

  // Evaluate status'

  // Ensure no checks returned blocked
  const hasBlocked = statusMap.find((obj) => obj.borchk?.blocked);

  // user is blocked by agency
  if (hasBlocked) {
    return {
      status: false,
      statusCode: hasBlocked.statusCode,
      userId: hasBlocked.userId,
    };
  }

  // Find match (with status 'true') according to prioritized Type array
  let match;
  USER_ID_TYPES.forEach((type) => {
    const res = statusMap.find((s) => s.type === type && s.status);
    if (res && !match) {
      match = res;
    }
  });

  // Return match
  if (match) {
    return {
      status: match.status,
      statusCode: match.statusCode,
      userId: match.userId,
    };
  }

  return {
    status: false,
    statusCode: "UNKNOWN_USER",
  };
}

/**
 *
 * Function to perform the actual borchk status check
 */
async function checkUserBorrowerStatus(
  { agencyId, userId = null, userPincode, isAccount = false },
  context
) {
  // status summary
  const summary = { status: true };

  // Get Borchk status
  const { status, blocked } = await context.datasources
    .getLoader("borchk")
    .load({
      userId,
      userPincode,
      libraryCode: agencyId,
    });

  // add to summary
  summary.borchk = { status, blocked };

  if (blocked) {
    // add to summary
    summary.statusCode = "BORCHK_USER_BLOCKED_BY_AGENCY";
    summary.status = false;
  }

  // No account found for the provided credentials
  if (status === "BORROWER_NOT_FOUND") {
    // continue check if status still true
    if (summary.status) {
      // If account exist in culr but borchk cant find user, the account must have been deleted behind culr.
      const statusCode = isAccount
        ? "BORCHK_USER_NO_LONGER_EXIST_ON_AGENCY"
        : "UNKNOWN_USER";

      // add to summary
      summary.statusCode = statusCode;
      summary.status = false;
    }
  }

  // Users affiliation could not be verified
  if (status !== "OK") {
    // continue check if status still true
    if (summary.status) {
      // add to summary
      summary.statusCode = "BORCHK_USER_NOT_VERIFIED";
      summary.status = false;
    }
  }

  if (summary.status) {
    summary.statusCode = "OK";
  }

  return summary;
}

// function to fetch possible userIds from userParameters
/**
 *
 * @param {*} userParams
 * @returns
 */
export function getUserIds(userParams) {
  // Select and return id fields with values
  const res = {};
  Object.entries(userParams).forEach(([k, v]) => {
    if (USER_ID_TYPES.includes(k)) {
      res[k] = v;
    }
  });
  return res;
}

/**
 * function to return a type value pair of userParam credentils
 * credentials are selected from a prioritized list (USER_ID_TYPES)
 *
 * @param {*} userParams
 * @returns {object}
 */
export function getUserIdTypeValuePair(userParams) {
  const ids = getUserIds(userParams);
  const arr = Object.entries(ids);

  if (arr.length) {
    return (
      arr
        // Konverterer entries til objekter
        .map(([type, value]) => ({ type, value }))
        // Sortér efter prioritetsrækkefølgen
        .sort(
          (a, b) =>
            USER_ID_TYPES.indexOf(a.type) - USER_ID_TYPES.indexOf(b.type)
        )
        // Send kun det første objekt i rækken
        .slice(0, 1)?.[0]
    );
  }

  return null;
}
