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
  const user = (
    await context.datasources.getLoader("smaug").load({
      accessToken,
    })
  ).user;

  if (!user?.id) {
    return [];
  }

  // select dataloader
  let dataloader = isValidCpr(user.id)
    ? "culrGetAccountsByGlobalId"
    : "culrGetAccountsByLocalId";

  // Retrieve user culr account
  const response = await context.datasources.getLoader(dataloader).load({
    userId: user.id,
    agencyId: user.agency,
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
function filterAccountsByProps(accounts = [], props = {}) {
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
