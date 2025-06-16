/**
 * @file This datasource is used to retrieve holdings from fbs-cms adapter (cicero api)
 */

import config from "../../config";

const { url, teamLabel } = config.datasources.rawrepo;

/**
 * Gets the holdings informations by recordid
 */
export async function load({ agencyId, recordId }, context) {
  if (recordId && agencyId) {
    const res = await context?.fetch(
      `${url}/updateovecode/${agencyId}/${recordId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        timeoutMs: 30000,
        allowedErrorStatusCodes: [405],
      }
    );

    if (res.status === 200) {
      return res.body || {};
    }
  }

  if (!recordId) {
    return {
      status: "FAILED",
      message: "Missing BibliographicRecordId",
    };
  }

  return {};
}

export { teamLabel };
