import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url } = config.datasources.borchk;

function createRequest(libraryCode, userId, userPincode) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://oss.dbc.dk/namespace/borchk">
<SOAP-ENV:Body>
  <ns1:borrowerCheckRequest>
    <ns1:serviceRequester>bibliotek.dk</ns1:serviceRequester>
    <ns1:libraryCode>DK-${libraryCode}</ns1:libraryCode>
    <ns1:userId>${userId}</ns1:userId>
    <ns1:userPincode>${userPincode}</ns1:userPincode>
    <ns1:outputType>json</ns1:outputType>
  </ns1:borrowerCheckRequest>
</SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
}

/**
 * Do a borchk - return request status
 * @param libraryCode
 * @param userId
 * @param userPincode
 * @return {Promise<string|*>}
 */
export async function load({ libraryCode, userId, userPincode }) {
  try {
    return (
      await request
        .post(url)
        .field("xml", createRequest(libraryCode, userId, userPincode))
    ).body.borrowerCheckResponse.requestStatus.$;
  } catch (e) {
    log.error("Request to borchk failed: " + url + " message: " + e.message);
    throw e;
    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
/*export async function status(loadFunc) {
  await loadFunc("870970-basis:51877330");
}*/
