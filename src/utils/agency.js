/**
 * Function to check if an agencyId is a FFU library
 *
 * @param {string} agencyId
 * @returns boolean
 */

export function isFFUAgency(agencyId) {
  const LENGTH = 6;
  const list = ["4", "6", "8", "9"];
  return agencyId.length === LENGTH && list.includes(agencyId.charAt(0));
}
