/**
 * @file Culr mock responses
 */

import { parseString } from "xml2js";
import { parseResponse } from "../culrGetAccountsByGlobalId.datasource";

export async function load({ userId }, context) {
  // Set Default status: ACCOUNT_DOES_NOT_EXIST
  let response = {
    status: 200,
    body: `<?xml version='1.0' encoding='UTF-8'?>
            <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
                <ns2:getAccountsByGlobalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                  <result>
                    <responseStatus>
                      <responseCode>ACCOUNT_DOES_NOT_EXIST</responseCode>
                      <responseMessage>Account does not exist</responseMessage>
                    </responseStatus>
                  </result>
                </ns2:getAccountsByGlobalIdResponse>
              </S:Body>
            </S:Envelope>`,
    ok: true,
  };

  // Success - 1 account
  if (userId === "0102033690") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                <S:Body>
                  <ns2:getAccountsByGlobalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                    <result>
                      <Account>
                        <provider>790900</provider>
                        <userIdType>CPR</userIdType>
                        <userIdValue>${userId}</userIdValue>
                      </Account>
                      <Guid>4e6b3143-1df7-4db1-b8b4-f19d413437cb</Guid>
                      <responseStatus>
                        <responseCode>OK200</responseCode>
                      </responseStatus>
                    </result>
                  </ns2:getAccountsByGlobalIdResponse>
                </S:Body>
              </S:Envelope>`,
      ok: true,
    };
  }

  // Success - 2 accounts
  if (userId === "0102033692") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?>
              <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
                <S:Body>
                  <ns2:getAccountsByGlobalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/">
                    <result>
                      <Account>
                        <provider>790900</provider>
                        <userIdType>CPR</userIdType>
                        <userIdValue>${userId}</userIdValue>
                      </Account>
                      <Account>
                        <provider>800010</provider>
                        <userIdType>LOCAL</userIdType>
                        <userIdValue>C000000002</userIdValue>
                      </Account>
                      <Guid>4e6b3143-1df7-4db1-b8b4-f19d413437cb</Guid>
                      <responseStatus>
                        <responseCode>OK200</responseCode>
                      </responseStatus>
                    </result>
                  </ns2:getAccountsByGlobalIdResponse>
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
