/**
 * @file Culr mock responses
 */

import { parseString } from "xml2js";
import { parseResponse } from "../culrCreateAccount.datasource";

export async function load({ agencyId, cpr, localId }, context) {
  // Set default status: ERROR
  let response = {
    body: { status: "ERROR" },
  };

  // illegal argument
  if (agencyId === "800027" && localId === "C000000002") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                <S:Body>
                <ns2:createAccountResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                <return>
                  <responseStatus>
                    <responseCode>ILLEGAL_ARGUMENT</responseCode>
                    <responseMessage>The provided agencyId in groupId 190101 cannot act as agent for agencyId ${localId}</responseMessage>
                  </responseStatus>
                </return>
              </ns2:createAccountResponse>
            </S:Body>
          </S:Envelope>`,
      ok: true,
    };
  }

  // success
  if (agencyId === "800010" && localId === "C000000002") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
                <ns2:createAccountResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                  <return>
                    <responseStatus>
                      <responseCode>OK200</responseCode>
                    </responseStatus>
                  </return>
                </ns2:createAccountResponse>
              </S:Body>
            </S:Envelope>`,
      ok: true,
    };
  }

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}

export { teamLabel };
