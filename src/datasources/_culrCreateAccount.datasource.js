/**
 * @file This datasource is used to subscribe a NEW user to an agency in CULR (OBS: User does not exist in CULR)
 */

import { parseString } from "xml2js";
import { log } from "dbc-node-logger";

import config from "../config";

const {
  url,
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.culr;

/**
 * Constructs soap request to perform request
 */
function constructSoap({ agencyId, cpr }) {
  let soap = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.culrservice.dbc.dk/">
  <soapenv:Header/>
  <soapenv:Body>
     <ws:createAccount>
     <agencyId>${agencyId}</agencyId>
        <userCredentials>
           <userIdType>CPR</userIdType>
           <userIdValue>${cpr}</userIdValue>
        </userCredentials>
        <authCredentials>
        <userIdAut>${authenticationUser}</userIdAut>
        <groupIdAut>${authenticationGroup}</groupIdAut>
        <passwordAut>${authenticationPassword}</passwordAut>
        </authCredentials>
     </ws:createAccount>
  </soapenv:Body>
</soapenv:Envelope>
`;

  return soap;
}

/**
 *
 * @param {*} fisk
 * @returns
 */

function parseResponse(xml) {
  try {
    const body = xml["S:Envelope"]["S:Body"];
    const result = body[0]["ns2:createAccountResponse"][0].return[0];

    const responseStatus = result.responseStatus[0];

    const code = responseStatus.responseCode[0];
    const message = responseStatus.responseMessage[0];

    return {
      code,
      message,
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
 * Creates the agency subscribtion
 */
export async function load({ agencyId, cpr }, context) {
  const soap = constructSoap({ agencyId, cpr });

  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  console.log("CULR => createAccount", soap, res);

  return new Promise((resolve) =>
    parseString(res.body, (err, result) => resolve(parseResponse(result)))
  );
}
