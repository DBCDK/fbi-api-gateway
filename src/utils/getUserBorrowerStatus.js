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
const USER_ID_TYPES = ["cpr", "userId", "cardno", "customId", "barcode"];

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
 * @param {string} props.context context
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
export default async function getUserBorrowerStatus(
  { agencyId, userIds = null, user },
  context
) {
  // Summary log
  const summary = { agencyId, userIds };

  // An agencyId must be provided
  if (!agencyId) {
    return { status: false, statusCode: "UNKNOWN_PICKUPAGENCY" };
  }

  // Authenticated or anonymous order
  const isAuthenticated = !!user?.userId;

  // add to summary log
  summary.isAuthenticated = isAuthenticated;

  // Verify that the agencyId has borrowerCheck
  // If NOT, No checks can be performed. We let the user place the order.
  const hasBorrowerCheck = await resolveBorrowerCheck(agencyId, context);

  // add to summary log
  summary.hasBorrowerCheck = hasBorrowerCheck;

  if (!hasBorrowerCheck) {
    // Verification possible in openorder
    const status = !!(isAuthenticated || !isEmpty(userIds));

    // Agency does not support borrowercheck - return status ok
    return {
      status,
      statusCode: status ? "OK" : "UNKNOWN_USER",
    };
  }

  // AgencyId has Borrowercheck, continue the order verification

  // userId may changes (let)
  let _userId;

  // UserId fetched from other account than loggedIn account
  let _isAccount;

  if (isAuthenticated) {
    // Check if the user is authenticated on the given pickUpBranch
    const verifiedOnPickUpBranch = !!(
      user?.userId && user?.loggedInAgencyId === agencyId
    );

    // add to summary log
    summary.verifiedOnPickUpBranch = verifiedOnPickUpBranch;

    // If so, we check if the user is allowed to place an order here.
    if (verifiedOnPickUpBranch) {
      _userId = user?.userId;
    }
    // If NOT, we fetch the authenticated users other accounts
    // User may have placed an order to a different account/agency, than they orignally signed-in at.
    else {
      // Fetch specific account between the loggedIn user accounts
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });

      // user account list
      const accounts = userinfo.attributes?.agencies;

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
      { agencyId, userId: _userId, isAccount: _isAccount },
      context
    );

    // Return if status blocked - No further checks needed
    if (result.borchk?.blocked) {
      log.warn(
        `checkUserBorrowerStatus: User is NOT allowed to place an order. ${JSON.stringify(
          { ...result, ...summary }
        )}`
      );

      return {
        status: result.status,
        statusCode: result.statusCode,
        userId: result.userId,
      };
    }

    // Return if status true - No further checks needed
    if (result.status) {
      log.info(
        `checkUserBorrowerStatus: User allowed to placed an order. ${JSON.stringify(
          { ...result, ...summary }
        )}`
      );

      // enrich response with the hasBorrowerCheck param
      return {
        status: result.status,
        statusCode: result.statusCode,
        userId: result.userId,
      };
    }
  }

  // If user is NOT Authenticated! We check the provided userIds

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
    log.warn(
      `checkUserBorrowerStatus: User is NOT allowed to place an order. ${JSON.stringify(
        { ...hasBlocked, ...summary }
      )}`
    );

    return {
      status: hasBlocked.status,
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
    log.info(
      `checkUserBorrowerStatus: User allowed to placed an order. ${JSON.stringify(
        { ...match, ...summary }
      )}`
    );

    return {
      status: match.status,
      statusCode: match.statusCode,
      userId: match.userId,
    };
  }

  // User is not allowed to place an order - no account found for provided credentials
  log.warn(
    `checkUserBorrowerStatus: User is NOT allowed to placed an order. ${JSON.stringify(
      {
        status: false,
        statusCode: "UNKNOWN_USER",
        statusMap,
        ...summary,
      }
    )}`
  );

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
  { agencyId, userId = null, isAccount = false },
  context
) {
  // status summary
  const summary = { status: true };

  // Get Borchk status
  const { status, blocked } = await context.datasources
    .getLoader("borchk")
    .load({
      userId: userId,
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
