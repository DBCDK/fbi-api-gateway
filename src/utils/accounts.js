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

  return filterAccountsByProps(response?.accounts, props);
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
 * Filter agencies by the given properties.
 *
 * @param {Array} agencies
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.agency
 * @param {string} props.type
 * @param {boolean} props.useLocalFallbackForUnrepresentedAgencies
 * @param {boolean} props.limitToOneAccountPerAgency
 *
 * @returns {Array}
 */
export function filterAgenciesByProps(
  agencies = [],
  {
    id,
    agency,
    type,
    useLocalFallbackForUnrepresentedAgencies = false,
    limitToOneAccountPerAgency = false,
  } = {}
) {
  if (agency) {
    agencies = agencies.filter(({ agencyId }) => agencyId === agency);
  }

  if (id) {
    agencies = agencies.filter(({ userId }) => userId === id);
  }

  if (type) {
    const agenciesBeforeTypeFilter = agencies;

    agencies = agencies.filter(({ userIdType }) => userIdType === type);

    if (useLocalFallbackForUnrepresentedAgencies) {
      agencies = addLocalFallbackForUnrepresentedAgencies(
        agencies,
        agenciesBeforeTypeFilter
      );
    }
  }

  if (limitToOneAccountPerAgency) {
    const representedAgencyIds = new Set();

    agencies = agencies.filter(({ agencyId }) => {
      if (representedAgencyIds.has(agencyId)) {
        return false;
      }

      representedAgencyIds.add(agencyId);
      return true;
    });
  }

  return agencies;
}

/**
 * Add one LOCAL account for each agency that is not represented
 * in the filtered result.
 *
 * @param {Array} filteredAgencies
 * @param {Array} sourceAgencies
 *
 * @returns {Array}
 */
function addLocalFallbackForUnrepresentedAgencies(
  filteredAgencies = [],
  sourceAgencies = []
) {
  const representedAgencyIds = new Set(
    filteredAgencies.map(({ agencyId }) => agencyId)
  );

  const localFallbacks = sourceAgencies.filter(({ agencyId, userIdType }) => {
    if (userIdType !== "LOCAL") {
      return false;
    }

    if (representedAgencyIds.has(agencyId)) {
      return false;
    }

    representedAgencyIds.add(agencyId);
    return true;
  });

  return [...filteredAgencies, ...localFallbacks];
}
