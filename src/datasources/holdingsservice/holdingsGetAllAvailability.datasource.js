/**
 * @file
 * Get all availability from holdingsservice
 * Example usage: context.datasources.getLoader("holdingsGetAllAvailability").load({ pid, role })
 */

import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.holdingsservice;

/**
 * Fetches holdings availability for a given pid and role
 * @param {Object} params
 * @param {string} params.pid - The pid to look up (e.g. '800010-katalog:99122005894905763')
 * @param {string} params.role - The role to use (e.g. 'bibdk')
 * @returns {Promise<Object|null>} The availability data or null if not found
 */
export async function load({ pid, role = "bibdk" }, context) {
  if (!pid) {
    return null;
  }

  const query = `?pid=${encodeURIComponent(pid)}&role=${encodeURIComponent(role)}`;
  const res = await context.fetch(`${url}getAllAvailability${query}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });

  if (res.ok) {
    return res.body;
  }
  return null;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
