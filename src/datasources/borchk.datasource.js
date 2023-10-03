/**
 * @file datasource of the borchk request
 *
 * Borrower check. Used to verify if a user is enrolled in a specific library and if the library is in the users municipality of residence.
 *
 */

import { log } from "dbc-node-logger";
import config from "../config";

import { parseString } from "xml2js";

const { url, ttl, prefix } = config.datasources.borchk;

/**
 * Construct BorrowerCheckComplex SOAP request (Complex)
 * @param libraryCode
 * @param userId
 * @param userPincode (optional) - The userPincode in the borchk request is optional
 * @return {String}
 *
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

    // The responding userId will always be the same as the requesting userId.
    const userId = result?.userId?.[0];
    const requestStatus = result?.requestStatus?.[0]?.toUpperCase();
    const municipalityNumber = result?.municipalityNumber?.[0];
    const blocked = !!(result?.blocked?.[0] === "true");

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
 * 
 * Known borchk status response codes
    - _**OK**_
    - _**SERVICE_NOT_LICENSED**_ - Invalid borchk request. Service not licensed
    - _**SERVICE_UNAVAILABLE**_ - Borchk service is unavailable
    - _**LIBRARY_NOT_FOUND**_ - The requested library was not found
    - _**BORROWERCHECK_NOT_ALLOWED**_ - Borrowercheck is not allowed
    - _**BORROWER_NOT_FOUND**_ - The requesting borrower was not found
    - _**BORROWER_NOT_IN_MUNICIPALITY**_ - The requesting borrower not in municipality
    - _**MUNICIPALITY_CHECK_NOT_SUPPORTED_BY_LIBRARY**_ - Municipality check not supported by library
    - _**NO_USER_IN_REQUEST**_ - Invalid borchk request. Missing user
    - _**ERROR_IN_REQUEST**_ - Invalid borchk request
 * 
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

/*
 * Simulate that user is blocked on agency 715100, but not others
 */
export async function testLoad({ libraryCode, userId, userPincode }, context) {
  const BLOCKED_LIBRARY = "715100";
  return {
    blocked: libraryCode === BLOCKED_LIBRARY ? true : false,
    status: libraryCode === BLOCKED_LIBRARY ? "NOT_OK" : "OK",
  };
}

export const options = {
  redis: {
    prefix: prefix,
    ttl: ttl,
  },
};
