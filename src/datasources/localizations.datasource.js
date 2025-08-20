import config from "../config";
import { log } from "dbc-node-logger";

const { url, prefix, teamLabel } = config.datasources.holdingsservice;

/*
.. This one was used for old datasource ... it prepends a pid with 870970-basis .. but why oh why ..
keep it for now - a pid which is actually a faust might show up and this function will be justified
function checkpids(pids) {
  const prepend = "870970-basis:";
  const fullPids = [];
  pids.forEach((pid) => {
    if (pid.indexOf(":") === -1) {
      // prepend with 870970-basis
      fullPids.push(prepend + pid);
    } else {
      fullPids.push(pid);
    }
  });
  return fullPids;
}
*/
export function parseResponse(localizations) {
  let count = localizations?.[0]?.agency?.length;
  const agencies = localizations?.[0]?.agency;

  if (count > 0) {
    const agencyMap = [];
    // agency may have more than one holding - make an agency unique with a
    // holding array
    for (const [key, value] of Object.entries(agencies)) {
      const holding = {
        localizationPid: value.localizationPid || "",
        codes: value.codes || "",
        localIdentifier: value.localIdentifier || "",
        agencyId: value.agencyId || "",
      };
      // check if agency is already in map
      const index = agencyMap.findIndex(
        (agency) => agency.agencyId === value.agencyId
      );
      if (index > -1) {
        // already in map - push holding
        agencyMap[index].holdingItems.push(holding);
      } else {
        // new in map - push initial object
        agencyMap.push({ agencyId: value.agencyId, holdingItems: [holding] });
      }
    }
    return { count: agencyMap?.length, agencies: agencyMap };
  } else {
    return { count: count };
  }
}

// TODO - holdingsitems
export async function load({ pids, localizationsRole }, context) {
  const body = {
    agencyId: 870970,
    pid: pids,
    mergePids: true,
  };

  if (typeof localizationsRole === "undefined") {
    // Fallback to bibdk when role is undefined
    body.role = "bibdk";
  } else if (localizationsRole === "bibdk") {
    // Role is explicitly set to bibdk
    body.role = "bibdk";
  } else if (localizationsRole !== null) {
    // When role is a string that is not bibdk, we set to danbib
    // a role explicitly set to null, will not send a role to the service
    body.role = "danbib";
  }

  try {
    const baseUrl = url.replace(/\/?$/, "/");
    const response = await context.fetch(
      baseUrl + "v1/holdings-status/localizations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    return parseResponse(response?.body?.localizations);
  } catch (e) {
    log.error("Request to holdingsservice failed." + " Message: " + e.message);
    // @TODO what to return here
  }
}

export const options = {
  // Enable per-request debugging for this datasource when "x-debug: true" is set
  allowDebug: true,
  external: true,
  redis: {
    prefix,
    ttl: 60 * 15, // cache for 15 minutes
  },
};

export { teamLabel };
