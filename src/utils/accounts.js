/**
 * @file This file handles util function to select single or multiple CULR accounts
 *
 */

import { isValidCpr } from "./cpr";

/**
 *
 * @param {string} accessToken
 * @param {object} context
 * @param {object} props - Filter accounts by given props (optional)
 * @param {string} props.id (optional)
 * @param {string} props.agency (optional)
 * @param {string} props.type - (optional)
 *
 * @returns {Promise} Object or null
 */
export async function getAccount(accessToken, context, props) {
  return (await getAccounts(accessToken, context, props))?.[0] || null;
}

/**
 *
 * @param {string} accessToken
 * @param {object} context
 * @param {object} props - Filter accounts by given props (optional)
 * @param {string} props.id (optional)
 * @param {string} props.agency (optional)
 * @param {string} props.type - (optional)
 *
 * @returns {Promise} (Array)
 */
export async function getAccounts(accessToken, context, props) {
  // userInfo
  const userinfo = await context.datasources.getLoader("userinfo").load({
    accessToken,
  });

  const user = userinfo?.attributes;

  if (!user?.userId) {
    return [];
  }

  // select dataloader
  let dataloader = isValidCpr(user.userId)
    ? "culrGetAccountsByGlobalId"
    : "culrGetAccountsByLocalId";

  // Retrieve user culr account
  const response = await context.datasources.getLoader(dataloader).load({
    userId: user.userId,
    agencyId: user.loggedInAgencyId,
  });

  return filterAccountsByProps(response.accounts, props);
}

/**
 *
 * @param {Array} accounts
 * @param {object} props - Filter accounts by given props (optional)
 * @param {string} props.id (optional)
 * @param {string} props.agency (optional)
 * @param {string} props.type - (optional)
 *
 * @returns {Array}
 */
export function filterAccountsByProps(accounts = [], props = {}) {
  if (props.agency) {
    accounts = accounts?.filter(({ agencyId }) => agencyId === props.agency);
  }
  if (props.id) {
    accounts = accounts?.filter(({ userIdValue }) => userIdValue === props.id);
  }
  if (props.type) {
    accounts = accounts?.filter(({ userIdType }) => userIdType === props.type);
  }
  return accounts;
}

/**
 *
 * Function to select a specific agency from a userinfo agencies list
 *
 * @param {Array} agencies
 * @param {object} props - Filter agencies by given props (optional)
 * @param {string} props.id (optional)
 * @param {string} props.agency (optional)
 * @param {string} props.type - (optional)
 *
 * @returns {Array}
 */
export function filterAgenciesByProps(agencies = [], props = {}) {
  if (props.agency) {
    agencies = agencies?.filter(({ agencyId }) => agencyId === props.agency);
  }
  if (props.id) {
    agencies = agencies?.filter(({ userId }) => userId === props.id);
  }
  if (props.type) {
    agencies = agencies?.filter(({ userIdType }) => userIdType === props.type);
  }
  return agencies;
}
