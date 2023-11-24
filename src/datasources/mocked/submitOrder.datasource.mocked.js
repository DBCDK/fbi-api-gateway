import { buildParameters, parseOrder } from "../submitOrder.datasource";

export async function load({ userId, input }) {
  const params = buildParameters({ userId, input, orderSystem: "TEST" });

  if (params.userId === "123" || userId === "some-id") {
    return parseOrder({
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
  } else {
    return null;
  }
}
