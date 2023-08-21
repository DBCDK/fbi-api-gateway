/**
 * @file This datasource is used to removes an agency from a user in CULR
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
function constructSoap({ agencyId, localId }) {
  let soap = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.culrservice.dbc.dk/">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:deleteAccount>
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
      </ws:deleteAccount>
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

export function parseResponse(xml) {
  try {
    const body = xml?.["S:Envelope"]?.["S:Body"];
    const result = body?.[0]?.["ns2:deleteAccountResponse"]?.[0]?.return?.[0];

    const responseStatus = result?.responseStatus?.[0];

    const code = responseStatus?.responseCode?.[0];
    const message = responseStatus?.responseMessage?.[0];

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
 * Removes an agency from a user
 */
export async function load({ agencyId, localId }, context) {
  const soap = constructSoap({ agencyId, localId });

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
