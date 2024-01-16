/**
 * Function to check if an agencyId is a FFU library
 *
 * @param {string} agencyId
 * @returns boolean
 */

export function _isFFUAgency(agencyId) {
  const LENGTH = 6;
  const list = ["4", "6", "8", "9"];
  return agencyId.length === LENGTH && list.includes(agencyId.charAt(0));
}

/**
 * Function to check if an agencyId is a FFU library
 *
 * @param {string} agencyId
 * @returns boolean
 */

export async function isFFUAgency(branchId, context) {
  if (!context) {
    // If no context given/available, fallback to old/static check.
    return _isFFUAgency(branchId);
  }

  const loader = context?.getLoader || context?.datasources?.getLoader;

  return !!(
    await loader("library").load({
      branchId,
      agencyTypes: ["FORSKNINGSBIBLIOTEK"],
    })
  ).result?.[0];
}
