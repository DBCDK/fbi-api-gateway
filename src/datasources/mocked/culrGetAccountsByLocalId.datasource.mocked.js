/**
 * @file Culr mock responses
 */

import { parseString } from "xml2js";
import { parseResponse } from "../culrGetAccountsByLocalId.datasource";

export async function load({ agencyId, userId }, context) {
  // Set Default status: ACCOUNT_DOES_NOT_EXIST
  let response = {
    status: 200,
    body: `<?xml version='1.0' encoding='UTF-8'?>
            <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
                <ns2:getAccountsByLocalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                  <result>
                    <responseStatus>
                      <responseCode>ACCOUNT_DOES_NOT_EXIST</responseCode>
                      <responseMessage>Account does not exist</responseMessage>
                    </responseStatus>
                  </result>
                </ns2:getAccountsByLocalIdResponse>
              </S:Body>
            </S:Envelope>`,
    ok: true,
  };

  // Success - 1 account
  if (agencyId === "800010" && userId === "C000000002") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                <S:Body>
                  <ns2:getAccountsByLocalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                    <result>
                      <Account>
                        <provider>${agencyId}</provider>
                        <userIdType>LOCAL</userIdType>
                        <userIdValue>${userId}</userIdValue>
                      </Account>
                      <Guid>4e6b3143-1df7-4db1-b8b4-f19d413437cb</Guid>
                      <responseStatus>
                        <responseCode>OK200</responseCode>
                      </responseStatus>
                    </result>
                  </ns2:getAccountsByLocalIdResponse>
                </S:Body>
              </S:Envelope>`,
      ok: true,
    };
  }

  // Success - 2 accounts
  if (agencyId === "800032" && userId === "C000000003") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                <S:Body>
                  <ns2:getAccountsByLocalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                    <result>
                      <Account>
                        <provider>${agencyId}</provider>
                        <userIdType>LOCAL</userIdType>
                        <userIdValue>${userId}</userIdValue>
                      </Account>
                      <Account>
                        <provider>800010</provider>
                        <userIdType>LOCAL</userIdType>
                        <userIdValue>C000000004</userIdValue>
                      </Account>
                      <Guid>4e6b3143-1df7-4db1-b8b4-f19d413437cb</Guid>
                      <responseStatus>
                        <responseCode>OK200</responseCode>
                      </responseStatus>
                    </result>
                  </ns2:getAccountsByLocalIdResponse>
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
