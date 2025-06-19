/**
 * @file This file handles "updateOveCode" request to the rawrepo/update service.
 */

import config from "../../config";

const { url, teamLabel } = config.datasources.rawrepo;

/**
 * Updates the Ove code for a bibliographic record.
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
