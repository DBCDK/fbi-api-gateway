/**
 * @file
 * Inter-library-loan holdings summary from holdingsservice
 * Example usage: context.datasources.getLoader("ill").load({ agencyId, id })
 */

import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.holdingsservice;

/**
 * Fetches the ILL summary for an agency and one or more ids.
 * @param {Object} params
 * @param {string} params.agencyId
 * @param {string[]} params.id - Manifestation ids (pid) or unit ids
 * @param {boolean} [params.mergePids]
 * @param {boolean} [params.complete]
 * @returns {Promise<Object|null>}
 */
export async function load(
  { agencyId, id, mergePids = false, complete = false },
  context
) {
  if (!agencyId || !id?.length) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("agencyId", agencyId);
  for (const value of id) {
    params.append("id", value);
  }
  if (mergePids) {
    params.set("mergePids", "true");
  }
  if (complete) {
    params.set("complete", "true");
  }
  if (context.trackingId) {
    params.set("trackingId", context.trackingId);
  }

  const baseUrl = url.replace(/\/?$/, "/");
  const res = await context.fetch(`${baseUrl}ill?${params}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });

  if (res.ok) {
    return res.body;
  }
  return null;
}

export const options = {
  allowDebug: true,
  external: true,
  redis: {
    prefix: "ill-" + prefix,
    ttl,
  },
};

export { teamLabel };
