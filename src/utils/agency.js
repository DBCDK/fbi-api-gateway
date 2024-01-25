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
   */

  const whitelist = [
    // Gymnasier
    "872960",
    "872600",
    "861640",
    "872320",
    "874260",
    "875140",

    // Login with mitId, when no library accounts
    "190101",
  ];

  if (whitelist.includes(branchId)) {
    return true;
  }

  return !!(await isFolkAgency(branchId, context));
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
