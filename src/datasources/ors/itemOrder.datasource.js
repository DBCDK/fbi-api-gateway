import config from "../../config";
const { url, ttl, prefix, teamLabel } = config.datasources.orderStatus;

/**
 * Fetch order status from ors-maintenance.
 */
export async function load({ itemId }, context) {
  const endpoint = url + "api/itemid/" + itemId;
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  return res.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};

export { teamLabel };
