import request from "superagent";
import config from "../config";
import {log} from "dbc-node-logger";

const { url, prefix } = config.datasources.holdingsservice;

/**
 * Constructs soap request to perform holdings request
 * @param {array} parameters
 * @returns {string} soap request string
 */



/*
function constructSoap(pids) {
  const soappids = pids.map((pid) => `<ns1:pid>${pid}</ns1:pid>`).join("");

  let soap = `<?xml version="1.0" encoding="UTF-8"?>
  <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://oss.dbc.dk/ns/openholdingstatus"><SOAP-ENV:Body>
    <ns1:localisationsRequest>
        <ns1:agencyId>DK-870970</ns1:agencyId>
        ${soappids}
        <ns1:outputType>json</ns1:outputType>
        <ns1:role>bibdk</ns1:role>
        <ns1:mergePids>true</ns1:mergePids>
    </ns1:localisationsRequest>
  </SOAP-ENV:Body></SOAP-ENV:Envelope>`;

  return soap;
}

export function parseResponse(text) {
  const obj = JSON.parse(text);

  let count =
    (obj.localisationsResponse &&
      obj.localisationsResponse.localisations[0] &&
      obj.localisationsResponse.localisations[0].agency &&
      obj.localisationsResponse.localisations[0].agency.length) ||
    0;

  if (count > 0) {
    const allagencies = obj.localisationsResponse.localisations[0].agency;
    const agencyMap = [];

    // agency may have more than one holding - make an agency unique with a
    // holding array
    for (const [key, value] of Object.entries(allagencies)) {
      const holding = {
        localizationPid:
          (value.localisationPid && value.localisationPid.$) || "",
        codes: (value.codes && value.codes.$) || "",
        localIdentifier:
          (value.localIdentifier && value.localIdentifier.$) || "",
        agencyId: (value.agencyId && value.agencyId.$) || "",
      };
      // check if agency is already in map
      const index = agencyMap.findIndex(
        (agency) => agency.agencyId === value.agencyId.$
      );
      if (index > -1) {
        // already in map - push holding
        agencyMap[index].holdingItems.push(holding);
      } else {
        // new in map - push initial object
        agencyMap.push({ agencyId: value.agencyId.$, holdingItems: [holding] });
      }
    }
    return { count: agencyMap.length, agencies: agencyMap };
  } else {
    return { count: count };
  }
}

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

// TODO - holdingsitems
export async function load({  pids }) {
  try {
    const response = await request.get(url+"localizations").query({
      agencyId: 870970,
      role:"bibdk",
      pid: pids,
      mergePids:true
    });
    console.log(response, "RESPONSE")
    console.log(response?.body?.localizations, "LOCALIZATION RESPONSE");
    return {count:response.body.localizations[0].agency.length, agencies:response.body.localizations[0].agency};
  } catch (e) {
    log.error("Request to holdingsservice failed." + " Message: " + e.message);
    console.log(e, "ERROR");
    // @TODO what to return here
  }
}

/*export async function load({ pids }) {
  const realpids = checkpids(pids);

  const query =
  const soap = constructSoap(realpids);
  const res = await request
    .post(url)
    .set("Content-Type", "text/xml")
    .send(soap);

  return parseResponse(res.text);
}*/


/*export const options = {
  redis: {
    prefix,
    ttl: 60 * 15, // cache for 15 minutes
  },
};*/
