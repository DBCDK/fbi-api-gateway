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
  // get rights from idp
  const idpRights = await context.datasources.getLoader("idp").load("");

  // check if users loggedInAgency has infomedia access
  const loggedInAgencyId = context?.smaug?.user?.agency;

  if (loggedInAgencyId && idpRights[loggedInAgencyId]) {
    return loggedInAgencyId;
  }

  // Alternativly check all users accounts

  // user info
  const userinfo = await context.datasources.getLoader("userinfo").load({
    accessToken: context.accessToken,
  });

  // filtered accounts
  const userInfoAccounts = filterDuplicateAgencies(
    userinfo?.attributes?.agencies
  );

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
export function getInfomediaAgencyId(context) {
  return infomedia(context);
}

/**
 *
 * @param {object} context
 *
 * @returns {boolean}
 */
export function hasInfomediaAccess(context) {
  return !!infomedia(context);
}