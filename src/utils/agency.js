/**
 * Function to check if an agencyId is a FFU library
 *
 * @param {string} branchId
 *
 * @returns {boolean}
 */

export function _isFFUAgency(branchId) {
  const LENGTH = 6;
  const list = ["4", "6", "8", "9"];
  return branchId.length === LENGTH && list.includes(branchId.charAt(0));
}

/**
 * Function to check if an agencyId is a FFU library
 *
 * @param {string} branchId
 * @param {object} context
 *
 * @returns {boolean}
 */

export async function isFFUAgency(branchId, context) {
  if (!context) {
    // If no context given/available, fallback to old/static check.
    return _isFFUAgency(branchId);
  }

  const loader = context?.getLoader || context?.datasources?.getLoader;

  const result = (await loader("library").load({ branchId })).result?.[0];

  // toUpperCase needed for mocked agencies (jest testing)
  return !!(result?.agencyType?.toUpperCase() === "FORSKNINGSBIBLIOTEK");
}

/**
 *
 * @param {string} branchId
 * @param {object} context
 *
 * @returns {boolean}
 */

export async function isFolkAgency(branchId, context) {
  if (!context) {
    // If no context given/available, fallback to old/static check.
    return branchId.startsWith("7");
  }

  const loader = context?.getLoader || context?.datasources?.getLoader;

  const result = (await loader("library").load({ branchId })).result?.[0];

  // toUpperCase needed for mocked agencies (jest testing)
  return !!(result?.agencyType?.toUpperCase() === "FOLKEBIBLIOTEK");
}

/**
 * Function to check if an agency sync data with culr
 *
 * @param {string} branchId
 * @returns {boolean}
 */
export async function hasCulrDataSync(branchId, context) {
  /**
   * Odense Katedralskole, 872960,
   * Roskilde Gymnasium, 872600
   * Sorø Akademis Skole, 861640
   * Slagelse Gymnasium, biblioteket 872320
   * Greve Gymnasium, Biblioteket 874260
   * Stenhus Gymnasium, 875140
   * Sct. Knuds Gymnasium, 871890
   */

  const whitelist = [
    // Gymnasier
    "872960",
    "872600",
    "861640",
    "872320",
    "874260",
    "875140",
    "871890",

    // Login with mitId, when no library accounts
    "190101",
  ];

  if (whitelist.includes(branchId)) {
    return true;
  }

  return !!(await isFolkAgency(branchId, context));
}

export function checkLoginIndependence(branch, list) {
  const { branchId, agencyId } = branch;

  // Check if the agency of the branch allows login (borrowercheck and login.bib.dk set to true)
  const hasAgencyLogin = !!list[agencyId];
  if (hasAgencyLogin) {
    return false;
  }

  // Check if branch uses a different login agency than itself
  // Branch has borrowercheck and login.bib.dk set to true, but uses a different agency for login.
  const hasAlternativeAgencyLogin = list[branchId];
  if (hasAlternativeAgencyLogin?.loginAgencyId !== branchId) {
    return false;
  }

  // Only branch allows login - branch is independent
  return true;
}

/**
 * Function to check if an branch acts as independent agency
 * These branches is under a "pseudo" agencyId, where login is not possible.
 * Branches has independent login (borrowercheck and login.bib.dk set to true).
 *
 * @param {string} branch (agencyId and branchId)
 * @param {context} context
 * @returns {boolean}
 */
export async function branchIsIndependent(branch, context) {
  const loader = context?.getLoader || context?.datasources?.getLoader;

  // get AgencyId from used branchId
  const list = await loader("vipcore_BorrowerCheckList").load("");

  return checkLoginIndependence(branch, list);
}

export async function getUserFromAllUserStatusData(props, context) {
  const agencies = props?.agencies || context?.user?.agencies;

  const all = await Promise.allSettled(
    agencies.map(async ({ agencyId, userId, userIdType }) => ({
      agencyId,
      userIdType,
      ...(await context.datasources.getLoader("user").load({
        userId,
        agencyId,
      })),
    }))
  );

  const users = [...all.map((u) => u?.value)];

  // remove undefined fields
  users.forEach((obj) =>
    Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key])
  );

  // Split data into CPR/LOCAL
  const cpr = users.filter((u) => u.userIdType === "CPR");
  const locals = users.filter((u) => u.userIdType === "LOCAL");

  // Prioritize CPR over LOCAL data
  return Object.assign({}, ...locals, ...cpr);
}

/**
 *
 * Function to find agencyId from branchId
 *
 * @param {string} branchId
 * @param {object} context
 * @returns {string} agencyId
 */

export async function getAgencyIdByBranchId(branchId, context) {
  const loader = context?.getLoader || context?.datasources?.getLoader;

  // get AgencyId from used branchId
  const result = (await loader("library").load({ branchId })).result?.[0];

  // return agencyId
  const agencyId = result?.agencyId;

  //  Return branchId instead of agencyId if branch act independently
  if (await branchIsIndependent(result, context)) {
    return branchId;
  }

  return agencyId;
}
