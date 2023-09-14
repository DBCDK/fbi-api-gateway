/**
 * @file
 *
 *  Util function to verify if user is allowed to place an order
 *  Checks if user is blocked and exist on the provided agency
 *
 */

import { resolveBorrowerCheck } from "../utils/utils";

import { log } from "dbc-node-logger";

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

export default async function getUserOrderAllowedStatus(
  { agencyId, userId = null },
  context
) {
  // agency must be provided
  if (!agencyId) {
    return { status: false, statusCode: "UNKNOWN_PICKUPAGENCY" };
  }

  // Verify that the agencyId has borrowerCheck
  const hasBorrowerCheck = await resolveBorrowerCheck(agencyId, context);

  if (hasBorrowerCheck) {
    // siturational userId credential for internal use
    let _userId;

    // Fetch specific account between the loggedIn user accounts
    // User may have placed an order to a different account/agency, than they orignally signed-in at.
    const userinfo = await context.datasources.getLoader("userinfo").load({
      accessToken: context.accessToken,
    });

    // user accounts liste
    const accounts = userinfo.attributes?.agencies;

    // fetch requested account from list
    // Local (type) account is preferred, because it will always exist
    const account = accounts?.find(
      (a) => a.agencyId === agencyId && a.userIdType === "LOCAL"
    );

    // Update internal userId
    // If an userinfo account was found, we use the userId credential from the matching local account
    // If NOT we use the provided userId (used for sessional orders) - fallbacks to login.bib.dk id if none provided
    _userId = account ? account?.userId : userId || context.smaug.user.id;

    const { status, blocked } = await context.datasources
      .getLoader("borchk")
      .load({
        userId: _userId,
        libraryCode: agencyId,
      });

    if (blocked) {
      // User is blocked on the provided pickupAgency
      log.warn(
        `User is not allowed to place an order. Borchk: ${JSON.stringify({
          status: false,
          agencyId,
          blocked,
          borchkStatus: status,
          statusCode: "BORCHK_USER_BLOCKED_BY_AGENCY",
        })}`
      );

      return {
        userId: _userId,
        isVerified: hasBorrowerCheck,
        status: false,
        statusCode: "BORCHK_USER_BLOCKED_BY_AGENCY",
      };
    }

    if (status === "BORROWER_NOT_FOUND") {
      // If account exist in culr but borchk cant find user, the account must have been deleted behind culr.
      const statusCode = !!account
        ? "BORCHK_USER_NO_LONGER_EXIST_ON_AGENCY"
        : "UNKNOWN_USER";

      // User does not (longer) exist on the provided pickupBranch
      log.warn(
        `User is not allowed to place an order. Borchk: ${JSON.stringify({
          status: false,
          agencyId,
          blocked,
          borchkStatus: status,
          statusCode,
        })}`
      );

      return {
        userId: _userId,
        isVerified: hasBorrowerCheck,
        status: false,
        statusCode,
      };
    }

    if (status !== "OK") {
      // User does not exist on the provided pickupBranch
      log.warn(
        `User is not allowed to place an order. Borchk: ${JSON.stringify({
          status: false,
          agencyId,
          blocked,
          borchkStatus: status,
          statusCode: "BORCHK_USER_NOT_VERIFIED",
        })}`
      );

      return {
        userId: _userId,
        isVerified: hasBorrowerCheck,
        status: false,
        statusCode: "BORCHK_USER_NOT_VERIFIED",
      };
    }

    // Return status ok
    return {
      userId: _userId,
      isVerified: hasBorrowerCheck,
      status: true,
      statusCode: "OK",
    };
  }

  log.warn(
    `Borchk not permitted by agencyId ${JSON.stringify({
      agencyId,
    })}`
  );

  // Agency does not support borrowercheck - return status ok
  return {
    userId,
    isVerified: hasBorrowerCheck,
    status: true,
    statusCode: "OK",
  };
}
