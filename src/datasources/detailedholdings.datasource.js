import config from "../config";
import { log } from "dbc-node-logger";

const { url, prefix } = config.datasources.holdingsservice;

function parseResponse(details, agencyId) {
  console.log(JSON.stringify(details, null, 4), "DETAILS");

  const localholdings = [];
  // catch errors
  if (details.error) {
    // red lamp - @TODO set message and lamp
    const errors = details.error;
    for (const [key, value] of Object.entries(errors)) {
      localholdings.push({
        localholdingsId: value.bibliographicRecordId.$ || "none",
        willLend: "false",
        expectedDelivery: "never",
      });
    }
  }

  /*console.log(
    JSON.stringify(details.responderDetailed, null, 4),
    "RESPONDERS DETAILED"
  );*/

  const responders = details.responderDetailed || [];

  // this one goes wront ..
  for (const [key, value] of Object.entries(responders)) {
    localholdings.push({
      localHoldingsId: value.localItemId || "",
      willLend: value.policy || "",
      expectedDelivery: value.expectedDelivery || "",
    });
  }

  return {
    count: responders?.length,
    branchId: agencyId,
    holdingstatus: localholdings,
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
    responderId: agencyId,
  }));

  return {
    lookupRecord: localids,
  };
}

// TODO - holdingsitems
export async function load({ localIds, agencyId }, context) {
  const query = construcQuery(localIds, agencyId);

  try {
    const response = await context.fetch(url + "detailed-holdings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    return parseResponse(response?.body, agencyId);
  } catch (e) {
    log.error("Request to holdingsservice failed." + " Message: " + e.message);
    console.log(e, "ERROR");
    // @TODO what to return here
  }
}

/*export const options = {
  redis: {
    prefix,
    ttl: 60 * 15, // cache for 15 minutes
  },
};*/
