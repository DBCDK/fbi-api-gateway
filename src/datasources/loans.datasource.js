import config from "../config";

const { url } = config.datasources.openuserstatus;
const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.openorder;

/**
 * SOAP request
 * Returns user loans
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
      <open:selectUserInfo>userLoan</open:selectUserInfo>
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
  body?.getUserStatusResponse?.userStatus?.loanedItems?.loan?.map((item) => ({
    loanId: item.loanId?.$,
    edition: item.edition?.$,
    dueDate: item.dateDue?.$,
    titleId: item.bibliographicRecordId?.$,
    title: item.title?.$,
    materialType: item.mediumType?.$,
    pages: item.pagination?.$,
    publisher: item.publisher?.$,
    language: item.language?.$,
    agencyId: agencyId, // Add agency used to fetch the order
  }));

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
 * Fetch user loans
 */
export async function load({ userAccounts }, context) {
  const collectedLoans = [];

  await Promise.all(
    userAccounts.map(async (account) => {
      const loans = await callService(account, context);
      if (!loans) {
        // No loans found, stop here
        return;
      }
      // Add to total list
      collectedLoans.push(loans);
    })
  );

  // Flatten the array
  return collectedLoans.flat();
}
