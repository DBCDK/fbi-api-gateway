/**
 * @file This datasource is used to subscribe a NEW user to an agency in CULR (OBS: User does not exist in CULR)
 */

import { parseString } from "xml2js";

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
function constructSoap({ agencyId, cpr, localId }) {
  let soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.culrservice.dbc.dk/">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:createAccount>
         <agencyId>${agencyId}</agencyId>
         <userCredentials>
            <userIdType>LOCAL</userIdType>
            <userIdValue>${localId}</userIdValue>
         </userCredentials>
         <authCredentials>
            <userIdAut>${authenticationUser}</userIdAut>
            <groupIdAut>${authenticationGroup}</groupIdAut>
            <passwordAut>${authenticationPassword}</passwordAut>
        </authCredentials>
         <globalUID>
            <uidType>CPR</uidType>
            <uidValue>${cpr}</uidValue>
         </globalUID>
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

    return {};
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
export async function load({ agencyId, cpr, localId }, context) {
  const soap = constructSoap({ agencyId, cpr, localId });

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
