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

/**
 * Function to check if an branch acts as independent agency
 *
 * @param {string} branchId // agencyId or branchId
 * @returns {boolean}
 */
export function branchIsIndependent(branchId) {
  const whitelist = [
    // Agencies
    "876040", // Nordjyske Gymnasiebiblioteker agency

    // Branches
    "872050", // Støvring Gymnasium, Biblioteket
    "872060", // Hjørring Gymnasium og HF-kursus, Biblioteket
    "872080", // Hasseris Gymnasium, Biblioteket
    "872090", // Brønderslev Gymnasium og HF-Kursus, Biblioteket
    "872100", // Vesthimmerlands Gymnasium & HF, Biblioteket
    "872140", // Aalborghus Gymnasium, Biblioteket
    "872340", // Frederikshavn Gymnasium, Gymnasiebiblioteket
    "872520", // Aalborg Katedralskole, Biblioteket
    "873310", // Nørresundby Gymnasium og HF, Biblioteket
    "874100", // Dronninglund Gymnasium, Biblioteket
  ];

  return whitelist.includes(branchId);
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
  if (branchIsIndependent(branchId)) {
    return branchId;
  }

  return agencyId;
}
