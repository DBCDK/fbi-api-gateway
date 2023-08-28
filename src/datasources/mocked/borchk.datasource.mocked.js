/**
 * @file Culr mock responses
 */

import { parseString } from "xml2js";
import { parseResponse } from "../borchk.datasource";

function constructResponse({ userId }, status = "ok") {
  let response = {
    status: 200,
    body: `<?xml version='1.0' encoding='UTF-8'?>
            <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
              <borrowerCheckResponse xmlns="http://oss.dbc.dk/ns/borchk">
                <userId>${userId}</userId>
                <requestStatus>${status}</requestStatus>
              </borrowerCheckResponse>
            </S:Body>
          </S:Envelope>`,
    ok: true,
  };

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}

export async function load({ libraryCode, userId, userPincode }, context) {
  const props = { libraryCode, userId, userPincode };

  // library not found status
  if (libraryCode === "000000") {
    return constructResponse(props, "library_not_found");
  }

  if (
    userId === "0123456789" &&
    userPincode === "0000" &&
    libraryCode === "710100"
  ) {
    return constructResponse(props, "borrower_not_found");
  }

  if (
    userId === "0123456789" &&
    userPincode === "1234" &&
    libraryCode === "710100"
  ) {
    return constructResponse(props, "ok");
  }
}
