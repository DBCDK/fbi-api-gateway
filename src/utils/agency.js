import { search as library } from "../datasources/library.datasource";

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

export async function isFFUAgency(props) {
  return !!(
    await library({
      ...props,
      agencyType: ["FORSKNINGSBIBLIOTEK"],
    })
  ).result?.[0];
}
