import { log } from "dbc-node-logger";
import config from "../config";

import { parseString } from "xml2js";

const { url, ttl, prefix } = config.datasources.borchk;

/**
 * Construct BorrowerCheckComplex SOAP request (Complex)
 * @param libraryCode
 * @param userId
 * @param userPincode (optional)
 * @return {String}
 */
function constructSoap({ libraryCode, userId, userPincode = null }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bor="http://oss.dbc.dk/ns/borchk">
    <soapenv:Header/>
    <soapenv:Body>
      <bor:borrowerCheckComplexRequest>
        <bor:serviceRequester>bibliotek.dk</bor:serviceRequester>
        <bor:libraryCode>DK-${libraryCode}</bor:libraryCode>
        <bor:userId>${userId}</bor:userId>
        ${userPincode && `<bor:userPincode>${userPincode}</bor:userPincode>`}
      </bor:borrowerCheckComplexRequest>
    </soapenv:Body>
  </soapenv:Envelope>`;
}

/**
 * Parse xml-json-string (badgerfish) to json
 *
 * @param {string} badgerfish xml
 * @returns {object}
 */
export function parseResponse(xml) {
  try {
    const body = xml?.["S:Envelope"]?.["S:Body"];
    const result = body?.[0]?.borrowerCheckComplexResponse?.[0];

    const userId = result?.userId?.[0];
    const requestStatus = result?.requestStatus?.[0]?.toUpperCase();
    const municipalityNumber = result?.municipalityNumber?.[0];

    const blocked = !(result?.blocked?.[0] === "false");

    return {
      userId,
      status: requestStatus,
      municipalityNumber,
      blocked,
    };
  } catch (e) {
    log.error("Failed to parse culr response", {
      error: e.message,
      stack: e.stack,
    });
    return {};
  }
}

/**
 * Borchk - return request status
 * @param libraryCode
 * @param userId
 * @param userPincode (optional)
 * @return {Promise<string|*>}
 */
export async function load({ libraryCode, userId, userPincode }, context) {
  const soap = constructSoap({ libraryCode, userId, userPincode });

  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  return new Promise((resolve) =>
    parseString(res.body, (err, result) => resolve(parseResponse(result)))
  );
}

export const options = {
  redis: {
    prefix: prefix,
    ttl: ttl,
  },
};
