import { parseString } from "xml2js";
import { parseResponse } from "../culrGetAccountsByLocalId.datasource";

export async function load({ agencyId, cpr, userId }, context) {
  // response from catInspire service

  let response = { body: "" };

  if (agencyId === "812345" && userId === "C000000001") {
    response = {
      status: 200,
      body: `<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns2:getAccountsByLocalIdResponse xmlns:ns2="http://ws.culrservice.dbc.dk/"><result><Account><provider>812345</provider><userIdType>LOCAL</userIdType><userIdValue>C000000001</userIdValue></Account><Guid>4e6b3143-1df7-4db1-b8b4-f19d413437cb</Guid><responseStatus><responseCode>OK200</responseCode></responseStatus></result></ns2:getAccountsByLocalIdResponse></S:Body></S:Envelope>`,
      ok: true,
    };
  }

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}
