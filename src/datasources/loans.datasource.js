import config from "../config";

const { url: openuserstatusUrl } = config.datasources.openuserstatus;
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

const reduceBody = (body) => ({
    loans: body.getUserStatusResponse.userStatus.loanedItems.loan.map(item => ({
      loanId: item.loanId.$,
      edition: item.edition.$,
      dueDate: item.dateDue.$,
      bibliographicId: item.bibliographicRecordId.$,
      title: item.title.$,
      materialType: item.mediumType.$
    }))
  });

/**
 * Fetch user info
 */

export async function load(bd, context) {
  const url = config.datasources.openplatform.url + "/user";
  const { accessToken } = bd;

  // Get user info
  const userinfo = await context.getLoader("userinfo").load({
    accessToken: accessToken,
  });

  // Get user attributes for the agency
  const agencyAttributes = userinfo?.attributes?.agencies?.find(
    (attributes) => attributes.agencyId === agencyId
  );

  // We need the userId
  const userId = agencyAttributes?.userId;

  console.log("dada", bd, agencyAttributes, userId, userinfo);

  const soap = constructSoap({ agencyId: "726500", userId: "2904951253" });
  const res = await context?.fetch(openuserstatusUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  const loans = reduceBody(res.body);
  console.log("LOANS", loans);

  return (
    await context.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
        userinfo: ["userLoan"],
      }),
    })
  ).body?.data;
}
