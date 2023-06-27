/**
 * @file This datasource is used to cancel an order placed through the openorder service
 * It leverages the openuserstatus service to cancel the order
 */
import config from "../config";
import { auditTrace, ACTIONS } from "@dbcdk/dbc-audittrail-logger";

const { url } = config.datasources.openuserstatus;
const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.openorder;

/**
 * Constructs soap request to perform cancelOrder request
 */
function constructSoap({ orderId, agencyId, userId }) {
  let soap = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openuserstatus">
   <soapenv:Header/>
   <soapenv:Body>
      <open:cancelOrderRequest>
         <open:agencyId>${agencyId}</open:agencyId>
         <open:authentication>
            <open:groupIdAut>${authenticationGroup}</open:groupIdAut>
            <open:passwordAut>${authenticationPassword}</open:passwordAut>
            <open:userIdAut>${authenticationUser}</open:userIdAut>
         </open:authentication>
         <open:cancelOrder>
            <open:orderId>${orderId}</open:orderId>
         </open:cancelOrder>
         <open:outputType>json</open:outputType>
         <open:userId>${userId}</open:userId>
      </open:cancelOrderRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

  return soap;
}

/**
 * Deletes the order
 */
export async function load(
  { orderId, agencyId, userId, smaug, accessToken },
  context
) {
  auditTrace(
    ACTIONS.write,
    config.app.id,
    smaug.app.ips,
    {
      login_token: accessToken,
    },
    `${userId}/${agencyId}`,
    {
      delete_order: orderId,
    }
  );

  const soap = constructSoap({ orderId, agencyId, userId });

  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  console.log("#################################", { res });

  return {
    error:
      res.body?.cancelOrderResponse?.cancelOrderStatus?.[0]?.cancelOrderError
        ?.$,
  };
}
