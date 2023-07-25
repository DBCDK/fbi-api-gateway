import config from "../config";
import { filterDuplicateAgencies } from "../utils/utils";

const { url } = config.datasources.openuserstatus;
const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.openorder;

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
  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  return reduceBody(res?.body, agencyId);
};

/**
 * Fetch user debts
 * @param accessToken: String
 */
export async function load({ accessToken }, context) {
  const userinfo = await context.getLoader("userinfo").load(
    {
      accessToken: accessToken,
    },
    context
  );
  const userInfoAccounts = filterDuplicateAgencies(
    userinfo?.attributes?.agencies
  );
  const collectedDebts = await Promise.all(
    userInfoAccounts.map(async (account) => {
      return await callService(account, context);
    })
  );

  // Flatten the array
  return collectedDebts.flat().filter((debt) => !!debt);
}
