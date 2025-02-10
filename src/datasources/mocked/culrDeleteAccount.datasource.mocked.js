/**
 * @file Culr mock responses
 */

import { parseString } from "xml2js";
import { parseResponse } from "../culrDeleteAccount.datasource";

export async function load({ agencyId, localId }, context) {
  // Set default status: ACCOUNT_DOES_NOT_EXIST
  let response = {
    status: 200,
    body: `<?xml version='1.0' encoding='UTF-8'?>
            <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
                <ns2:deleteAccountResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                  <return>
                    <responseStatus>
                    <responseCode>ACCOUNT_DOES_NOT_EXIST</responseCode>
                    <responseMessage>Account does not exist</responseMessage>
                  </responseStatus>
                </return>
              </ns2:deleteAccountResponse>
            </S:Body>
          </S:Envelope>`,
    ok: true,
  };

  // success
  if (agencyId === "800010" && localId === "C000000002") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                <S:Body>
                  <ns2:deleteAccountResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                    <return>
                      <responseStatus>
                        <responseCode>OK200</responseCode>
                      </responseStatus>
                    </return>
                  </ns2:deleteAccountResponse>
                </S:Body>
              </S:Envelope>`,
      ok: true,
    };
  }

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}
