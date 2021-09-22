import { processRequest } from "../submitOrder.datasource";

export async function load(input) {
  const postSoap = () =>
    `<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns1:placeOrderResponse xmlns:ns1="http://oss.dbc.dk/ns/openorder"><ns1:orderPlaced><ns1:orderId>1041254137</ns1:orderId><ns1:orderPlacedMessage>not_owned_ILL_loc</ns1:orderPlacedMessage></ns1:orderPlaced></ns1:placeOrderResponse></S:Body></S:Envelope>`;

  return await processRequest(input, postSoap);
}
