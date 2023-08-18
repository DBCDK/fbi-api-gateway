import { parseString } from "xml2js";
import { parseResponse } from "../culrCreateAccount.datasource";

function response() {}

export async function load({ agencyId, cpr, localId }, context) {
  // response from catInspire service

  if (agencyId === "812345" && localId === "C000000001") {
    const response = {
      body: {},
    };
  }

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}
