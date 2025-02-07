/**
 * @file This datasource is used to retrieve a users agency accounts from CULR
 */

import { parseString } from "xml2js";
import { log } from "dbc-node-logger";

import config from "../config";
import { accountsToCulr, getTestUser } from "../utils/testUserStore";

const {
  soap_url: url,
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
  teamLabel,
} = config.datasources.culr;

/**
 * Constructs soap request to perform request
 */
function constructSoap({ userId }) {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.culrservice.dbc.dk/">
  <soapenv:Header/>
  <soapenv:Body>
     <ws:getAccountsByGlobalId>
        <userCredentials>
          <uidType>CPR</uidType>
          <uidValue>${userId}</uidValue>
        </userCredentials>
        <authCredentials>
          <userIdAut>${authenticationUser}</userIdAut>
          <groupIdAut>${authenticationGroup}</groupIdAut>
          <passwordAut>${authenticationPassword}</passwordAut>
        </authCredentials>
     </ws:getAccountsByGlobalId>
  </soapenv:Body>
</soapenv:Envelope>
`;
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
    const result =
      body?.[0]?.["ns2:getAccountsByGlobalIdResponse"]?.[0]?.result?.[0];

    const responseStatus = result?.responseStatus?.[0];

    const code = responseStatus?.responseCode?.[0];
    const message = responseStatus?.responseMessage?.[0];

    const municipalityNo = result?.MunicipalityNo?.[0];
    const guid = result?.Guid?.[0];

    const accounts = result?.Account?.map((account) => ({
      agencyId: account?.provider?.[0],
      userIdType: account?.userIdType?.[0],
      userIdValue: account?.userIdValue?.[0],
    }));

    return {
      code,
      message,
      accounts,
      municipalityNo,
      guid,
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
 * Gets the CULR account information
 */
export async function load({ userId }, context) {
  const soap = constructSoap({ userId });
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

/**
 * Gets the CULR account information
 */
export async function testLoad({ userId }, context) {
  const testUser = await getTestUser(context);
  const localAccount = testUser.accounts.find(
    (account) => account.cpr === userId
  );

  if (!localAccount) {
    return { code: "ACCOUNT_DOES_NOT_EXIST" };
  }
  const merged = testUser.accounts.filter(
    (account) => localAccount.uniqueId === account.uniqueId
  );

  return {
    guid: localAccount.uniqueId,
    municipalityNo: merged
      .find((account) => account.isMunicipality)
      ?.agency?.substring(1, 4),
    accounts: accountsToCulr(merged).map((agency) => ({
      ...agency,
      userIdValue: agency.userId,
    })),
  };
}
