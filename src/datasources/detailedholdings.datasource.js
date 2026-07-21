import config from "../config";
import { log } from "dbc-node-logger";

const { url, prefix, teamLabel } = config.datasources.holdingsservice;
const DETAILED_HOLDINGS_CONFIGURATION_ERRORS = new Set([
  "LIBRARY_CONFIGURATION_ERROR",
  "VIPCORE_ERROR",
  "error_in_library_configuration",
  "error_getting_library_configuration",
]);

function normalizeBranchId(responderId) {
  return String(responderId || "")
    .toUpperCase()
    .replace("DK", "")
    .replace("-", "");
}

function parseResponse(details, agencyId) {
  const localholdings = [];

  const errors = Array.isArray(details?.error) ? details.error : [];
  if (errors.length > 0) {
    for (const value of errors) {
      localholdings.push({
        localHoldingsId: value?.bibliographicRecordId || "none",
        willLend: "false",
        expectedDelivery: "never",
      });
    }
  }

  const responders = Array.isArray(details?.responderDetailed)
    ? details.responderDetailed
    : [];
  for (const value of responders) {
    const firstHoldingItem = value?.holdingsItem?.[0] || {};

    localholdings.push({
      branchId: normalizeBranchId(value?.responderId),
      localHoldingsId: firstHoldingItem?.localItemId || "",
      willLend: firstHoldingItem?.policy || "",
      expectedDelivery: firstHoldingItem?.expectedDelivery || "",
      policy: firstHoldingItem?.policy,
    });
  }

  return {
    supportDetailedHoldings: !errors.some((error) =>
      DETAILED_HOLDINGS_CONFIGURATION_ERRORS.has(
        String(error?.errorMessage?.value ?? error?.errorMessage ?? "")
      )
    ),
    branchId: agencyId,
    holdingstatus: localholdings,
    expectedDelivery: [...localholdings]
      .map((item) => item?.expectedDelivery)
      .sort((a, b) => new Date(a) - new Date(b))?.[0],
  };
}

/**
 * construct the query (lookupRecord:[{bibliographicRecordId, responderId}])
 * @param localIds
 * @param agencyId
 * @returns {{lookupRecord: *}}
 */
function construcQuery(localIds, agencyId) {
  const localids = localIds.map((loc) => ({
    bibliographicRecordId: loc.localIdentifier,
    responderId: loc.agencyId || agencyId,
  }));

  return {
    lookupRecord: localids,
  };
}

// TODO - holdingsitems
export async function load({ localIds, agencyId }, context) {
  const query = construcQuery(localIds, agencyId);

  try {
    const baseUrl = url.replace(/\/?$/, "/");
    const response = await context.fetch(baseUrl + "detailed-holdings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
      timeoutMs: 60000,
    });

    return parseResponse(response?.body, agencyId);
  } catch (e) {
    log.error("Request to holdingsservice failed." + " Message: " + e.message);
    // @TODO what to return here
  }
}

export const options = {
  // Enable per-request debugging for this datasource when "x-debug: true" is set
  allowDebug: true,
  redis: {
    prefix,
    ttl: 60 * 15, // cache for 15 minutes
  },
};

export { teamLabel };
