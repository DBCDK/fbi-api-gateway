/**
 * @file Culr mock responses
 */

import { parseString } from "xml2js";
import { parseResponse } from "../borchk.datasource";

function constructResponse(
  { userId, municipalityNumber = "400", blocked = "false" },
  status = "ok"
) {
  let response = {
    status: 200,
    body: `<?xml version='1.0' encoding='UTF-8'?>
            <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
                <borrowerCheckComplexResponse xmlns="http://oss.dbc.dk/ns/borchk">
                  <userId>${userId}</userId>
                  <requestStatus>${status}</requestStatus>
                  <municipalityNumber>${municipalityNumber}</municipalityNumber>
                  <blocked>${blocked}</blocked>
                </borrowerCheckComplexResponse>
              </S:Body>
            </S:Envelope>`,
    ok: true,
  };

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}

export async function load(
  { libraryCode, userId, userPincode = null },
  context
) {
  const props = { libraryCode, userId };

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

  if (userId === "some@mail.com" && libraryCode === "715100") {
    return constructResponse(props, "ok");
  }

  if (userId === "some-blocked-id" && libraryCode === "715100") {
    return constructResponse({ ...props, blocked: true }, "ok");
  }

  if (userId === "some-id" && libraryCode === "715100") {
    return constructResponse(props, "ok");
  }

  return constructResponse(props, "borrower_not_found");
}
