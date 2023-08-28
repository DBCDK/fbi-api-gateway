import { log } from "dbc-node-logger";
import config from "../config";

import { parseString } from "xml2js";

const { url } = config.datasources.borchk;

function constructSoap({ libraryCode, userId, userPincode }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bor="http://oss.dbc.dk/ns/borchk">
    <soapenv:Header/>
    <soapenv:Body>
      <bor:borrowerCheckRequest>
        <bor:serviceRequester>bibliotek.dk</bor:serviceRequester>
        <bor:libraryCode>DK-${libraryCode}</bor:libraryCode>
        <bor:userId>${userId}</bor:userId>
        <bor:userPincode>${userPincode}</bor:userPincode>
      </bor:borrowerCheckRequest>
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
    const result = body?.[0]?.borrowerCheckResponse?.[0];

    const responseStatus = result?.requestStatus?.[0];

    return {
      responseStatus,
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
 * @param userPincode
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

  console.log("res", res);

  return new Promise((resolve) =>
    parseString(res.body, (err, result) => resolve(parseResponse(result)))
  );
}
