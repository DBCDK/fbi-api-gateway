import { processRequest } from "../submitOrder.datasource";

export async function load(input) {
  const postSoap = () => ({
    status: 200,
    body: {
      orderPlaced: {
        orderId: "1046910462",
        orderPlacedMessage: "NOT_OWNED_ILL_LOC",
      },
      orderCondition: [],
    },
    ok: true,
  });

  return await processRequest(input, postSoap);
}
