/**
 * @file This datasource is used to create a new account for a CPR validated user
 */

import { parseString } from "xml2js";
import { log } from "dbc-node-logger";

import config from "../config";
import { getTestUser, storeTestUser } from "../utils/testUserStore";

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
 * Parse xml-json-string (badgerfish) to json
 *
 * @param {string} badgerfish xml
 * @returns {object}
 */
export function parseResponse(xml) {
  try {
    const body = xml?.["S:Envelope"]?.["S:Body"];
    const result = body?.[0]?.["ns2:createAccountResponse"]?.[0]?.return?.[0];

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

export async function testLoad({ agencyId, cpr, localId }, context) {
  const testUser = await getTestUser(context);
  const accounts = testUser.accounts.filter(
    (agency) => agencyId !== agency.agency
  );
  accounts.push({ agency: agencyId, cpr, localId });
  await storeTestUser({ ...testUser, accounts: accounts }, context);

  return { code: "OK200" };
}
