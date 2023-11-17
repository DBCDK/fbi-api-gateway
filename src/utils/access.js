/**
 * @file access util functions
 */

import { filterDuplicateAgencies } from "./utils";

/**
 *
 * Check whether any of the users libraries has access to Infomedia.
 * The returned agencyId will be billed for infomedia access.
 *
 * First we check if the users login library has access to info media, if not,
 * we check if any other og the users associated accounts has access to infomedia,
 * if so, we return the first one found.
 *
 * @param {object} context
 *
 * @returns {null | string} AgencyId
 */
async function infomedia(context) {
  const user = context.user;

  // get rights from idp
  const idpRights = await context.datasources.getLoader("idp").load("");

  // check if users loggedInAgency has infomedia access
  const loggedInAgencyId = user?.loggedInAgencyId;

  if (loggedInAgencyId && idpRights[loggedInAgencyId]) {
    return loggedInAgencyId;
  }

  // Alternativly check all users accounts

  // filtered accounts
  const userInfoAccounts = filterDuplicateAgencies(user.agencies);

  const hasAccess = userInfoAccounts?.filter(
    ({ agencyId }) => idpRights[agencyId]
  );

  // check for infomedia access - if any of users agencies subscribes
  if (hasAccess.length > 0) {
    return hasAccess[0]?.agencyId;
  }

  return null;
}

/**
 *
 * @param {object} context
 *
 * @returns {null | string} AgencyId
 */
export async function getInfomediaAgencyId(context) {
  return await infomedia(context);
}

/**
 *
 * @param {object} context
 *
 * @returns {boolean}
 */
export async function hasInfomediaAccess(context) {
  return !!(await infomedia(context));
}
