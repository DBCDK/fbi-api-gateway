import { parseString } from "xml2js";
import { parseResponse } from "../culrCreateAccount.datasource";

export async function load({ agencyId, cpr, localId }, context) {
  // response from catInspire service

  if (cpr === "0123456789") {
    const response = {
      body: {},
    };
  }

  return new Promise((resolve) =>
    parseString(response.body, (err, result) => resolve(parseResponse(result)))
  );
}
