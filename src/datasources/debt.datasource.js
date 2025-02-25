import config from "../config";
import { getTestUser } from "../utils/testUserStore";
import { filterDuplicateAgencies } from "../utils/utils";

const { url, teamLabel } = config.datasources.openuserstatus;
const { authenticationUser, authenticationGroup, authenticationPassword } =
  config.datasources.openorder;

/**
 * SOAP request
 * Returns either total debt or debts individually.
 */
const constructSoap = ({ agencyId, userId }) => {
  let soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openuserstatus">
  <soapenv:Header/>
  <soapenv:Body>
    <open:getUserStatusRequest>
      <open:agencyId>${agencyId}</open:agencyId>
      <open:authentication>
        <open:groupIdAut>${authenticationGroup}</open:groupIdAut>
        <open:passwordAut>${authenticationPassword}</open:passwordAut>
        <open:userIdAut>${authenticationUser}</open:userIdAut>
      </open:authentication>
      <open:outputType>json</open:outputType>
      <open:userId>${userId}</open:userId>
      <open:selectUserInfo>userFiscal</open:selectUserInfo>
    </open:getUserStatusRequest>
  </soapenv:Body>
</soapenv:Envelope>
`;

  return soap;
};

/**
 * Reduce body data to match data model
 */
const reduceBody = (body, agencyId) =>
  body?.getUserStatusResponse?.userStatus?.fiscalAccount?.fiscalTransaction?.map(
    (item) => ({
      amount: item.fiscalTransactionAmount?.$,
      currency: item.fiscalTransactionCurrency?.$,
      title: item.title?.$,
      date: item.fiscalTransactionDate?.$,
      agencyId: agencyId, // Add agency used to fetch the debt
    })
  );

/**
 * Call SOAP service for one user account
 */
const callService = async ({ agencyId, userId }, context) => {
  const soap = constructSoap({ agencyId: agencyId, userId: userId });
  return await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
    timeoutMs: 60000,
  });
};

/**
 * Fetch user debts
 * @param userInfoAccounts: [{agencyId: String, userId: String, userIdType: String}]
 */
export async function load({ userInfoAccounts }, context) {
  let errormessage = "OK";
  let status = true;
  const collectedDebts = await Promise.all(
    userInfoAccounts.map(async (account) => {
      const res = await callService(account, context);
      // only set errormessage if something went wrong
      if (!res?.ok) {
        if (res?.status === "UND_ERR_HEADERS_TIMEOUT") {
          errormessage = res?.status;
        } else {
          errormessage = "UNKNOWN_ERROR";
        }
      }
      status = !!res?.ok;
      return reduceBody(res?.body, account?.agencyId);
    })
  );

  return {
    status: status,
    statusCode: errormessage,
    // Flatten debt array
    result: collectedDebts.flat().filter((debt) => !!debt),
  };
}

export async function testLoad({ userInfoAccounts }, context) {
  const testUser = await getTestUser(context);
  return testUser.merged
    .filter((account) => account.debt)
    .map((account) => ({
      amount: account.debt,
      currency: "DKK",
      title: "Fed titel",
      date: "2007-12-03T10:15:30Z",
      agencyId: account.agency,
    }));
}

export const options = {
  external: true,
};

export { teamLabel };
