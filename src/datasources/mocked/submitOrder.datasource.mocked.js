import { buildParameters, parseOrder } from "../submitOrder.datasource";

export async function load({ userId, input }) {
  const params = buildParameters({ userId, input, orderSystem: "TEST" });

  if (input.pickUpBranch === "123") {
    return parseOrder({
      status: 400,
      body: {
        orderPlaced: {
          orderId: "1046910462",
          orderPlacedMessage: "UNKNOWN_PICKUPAGENCY",
        },
        orderCondition: [],
      },
      ok: false,
    });
  }

  if (input.pids?.length === 0) {
    return parseOrder({
      status: 400,
      body: {
        orderPlaced: {
          orderId: "1046910462",
          orderPlacedMessage: "INVALID_ORDER",
        },
        orderCondition: [],
      },
      ok: false,
    });
  }

  if (
    params.userId === "123" ||
    params.userId === "some-id" ||
    userId === "some-id"
  ) {
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

export { teamLabel };
