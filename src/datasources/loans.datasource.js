import config from "../config";

const { url } = config.datasources.openuserstatus;
const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.openorder;

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

const reduceBody = (body) =>
  body.getUserStatusResponse.userStatus.loanedItems.loan?.map((item) => ({
    loanId: item.loanId.$,
    edition: item.edition.$,
    dueDate: item.dateDue.$,
    titleId: item.bibliographicRecordId.$,
    title: item.title.$,
    materialType: item.mediumType.$,
  }));

const callService = async ({ agencyId, userId }, context) => {
  const soap = constructSoap({ agencyId: agencyId, userId: userId });
  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  return reduceBody(res.body);
};

export async function load({ accessToken, userAccounts }, context) {
  const collectedLoans = [];

  await Promise.all(
    userAccounts.map(async (account) => {
      const loans = await callService(account, context);
      if (!loans) {
        // No loans found, stop here
        return;
      }
      // Add agency used to fetch the loan
      loans?.map((loan) => ({ ...loan, agencyId: account.agencyId }));
      // Add to total list
      collectedLoans.push(loans);
    })
  );

  // Flatten the array
  const result = {
    loans: collectedLoans.flat(),
  };

  return result;
}
