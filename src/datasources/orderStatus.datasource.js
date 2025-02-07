import config from "../config";
const { url, ttl, prefix, teamLabel } = config.datasources.orderStatus;

/**
 * Fetch order status from ors-maintenance.
 */
export async function load({ orderId }, context) {
  const endpoint = url + "api/orders/" + orderId;
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  //we expect orderList to always have one element since we are rquesting for a specific orderId.
  return res?.body?.orderList[0];
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};

export { teamLabel };
