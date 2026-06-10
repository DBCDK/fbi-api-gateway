import config from "../config";
import { log } from "dbc-node-logger";

const { url, prefix, teamLabel } = config.datasources.holdingsservice;
export function parseResponse(localizations) {
  const count = localizations?.[0]?.agency?.length;
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

export async function load({ pids, localizationsRole }, context) {
  const body = {
    agencyId: "870970",
    pid: pids,
    mergePids: true,
  };

  if (localizationsRole !== undefined) {
    body.role = localizationsRole;
  }

  try {
    const baseUrl = url.replace(/\/?$/, "/");
    const response = await context.fetch(baseUrl + "localizations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

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
