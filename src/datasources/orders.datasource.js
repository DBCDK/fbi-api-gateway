import config from "../config";
const { url, teamLabel } = config.datasources.openuserstatus;
const { authenticationUser, authenticationGroup, authenticationPassword } =
  config.datasources.openorder;

/**
 * SOAP request
 * Returns user orders
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
      <open:selectUserInfo>userOrder</open:selectUserInfo>
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
  body?.getUserStatusResponse?.userStatus?.orderedItems?.order?.map((item) => ({
    creator: item.author?.$,
    titleId: item.bibliographicRecordId?.$,
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
    pickUpAgency: item.pickUpAgency?.$, // Can we get pickupbranch?
    pickUpExpiryDate: item.pickUpExpiryDate?.$,
    agencyId: agencyId, // Add agency used to fetch the order
  }));

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
    timeoutMs: 240000,
  });
};

/**
 * Fetch user orders
 * @param userInfoAccounts: [{agencyId: String, userId: String, userIdType: String}]
 */
export async function load({ userInfoAccounts }, context) {
  let errormessage = "OK";
  let status = true;
  const collectedOrders = await Promise.all(
    userInfoAccounts.map(async (account) => {
      const res = await callService(account, context);
      // only set errormessage if something went wrong
      if (!res?.ok) {
        if (res?.status === "UND_ERR_HEADERS_TIMEOUT") {
          errormessage = res?.status;
        } else {
          // @TODO we need to find out what errormessages to handle - for now return UNKNOWN
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
    // Flatten order array
    result: collectedOrders.flat().filter((order) => !!order),
  };
}

export const options = {
  external: true,
};

export { teamLabel };
