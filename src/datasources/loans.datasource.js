import config from "../config";

const { url } = config.datasources.openuserstatus;
const { authenticationUser, authenticationGroup, authenticationPassword } =
  config.datasources.openorder;

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
  body?.getUserStatusResponse?.userStatus?.loanedItems?.loan?.map((item) => {
    return {
      loanId: item.loanId?.$,
      edition: item.edition?.$,
      dueDate: item.dateDue?.$,
      titleId: item.bibliographicRecordId?.$,
      title: item.title?.$,
      materialType: item.mediumType?.$,
      pages: item.pagination?.$,
      publisher: item.publisher?.$,
      language: item.language?.$,
      creator: item.author?.$,
      agencyId: agencyId, // Add agency used to fetch the order
    };
  });

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
    timeoutMs: 240000,
  });

  return reduceBody(res?.body, agencyId);
};

/**
 * Fetch user loans
 * @param userInfoAccounts: [{agencyId: String, userId: String, userIdType: String}]
 */
export async function load({ userInfoAccounts }, context) {
  const collectedLoans = await Promise.all(
    userInfoAccounts.map(async (account) => {
      return await callService(account, context);
    })
  );

  // Flatten the array
  return collectedLoans.flat().filter((loan) => !!loan);
}

/*
 * Loans when using test token
 */
export async function testLoad({ userInfoAccounts }, context) {
  const agencyId = userInfoAccounts[0]?.agencyId;
  if (!agencyId) {
    return [];
  }
  return [
    {
      loanId: "120200590",
      dueDate: "2023-09-22T00:00:00+02:00",
      titleId: "51701763",
      title: "Vennebogen & Koglerier: to skuespil",
      materialType: "Bog",
      pages: "219 sider",
      publisher: "Lindhardt og Ringhof 2001",
      language: "dan",
      agencyId,
    },
    {
      loanId: "120200589",
      edition: "1. udgave",
      dueDate: "2023-09-24T00:00:00+02:00",
      titleId: "23424916",
      title: "Efter uvejret",
      materialType: "Bog",
      pages: "196 sider",
      publisher: "Borgen 2007",
      language: "dan",
      agencyId,
    },
  ];
}

export const options = {
  external: true,
};
