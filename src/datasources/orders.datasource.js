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
      <open:selectUserInfo>userOrder</open:selectUserInfo>
    </open:getUserStatusRequest>
  </soapenv:Body>
</soapenv:Envelope>
`;

  return soap;
};

const reduceBody = (body) => ({
  orders: body.getUserStatusResponse.userStatus.orderedItems.order?.map(
    (item) => ({
      author: item.author?.$,
      bibliographicId: item.bibliographicRecordId?.$,
      publisher: item.publisher?.$,
      materialType: item.mediumType?.$,
      title: item.title?.$,
      orderDate: item.orderDate?.$,
      orderId: item.orderId?.$,
      pages: item.pagination?.$,
      language: item.language?.$,
      edition: item.edition?.$,
      orderStatus: item.orderStatus?.$,
      orderType: item.orderType?.$,
      holdQueuePosition: item.holdQueuePosition?.$,
      pickUpAgency: item.pickUpAgency?.$,
      pickUpExpiryDate: item.pickUpExpiryDate?.$,
    })
  ),
});

/**
 * Fetch user info
 */
export async function load({ accessToken }, context) {
  const soap = constructSoap({ agencyId: "726500", userId: "2904951253" });

  const res = await context?.fetch(openuserstatusUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  const orders = reduceBody(res.body);

  console.log("ORDERS", orders);

  /* OLD */

  const url = config.datasources.openplatform.url + "/user";

  return (
    await context.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
        userinfo: ["userOrder"],
      }),
    })
  ).body?.data;
}
