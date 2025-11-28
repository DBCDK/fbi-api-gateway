import config from "../../config";
import {log} from "dbc-node-logger";

const { serviceRequester, url, teamLabel } = config.datasources.openorder;

export async function load({ accessToken, orderId, requesterId}, context) {

  const parameters = {
    "requesterId": requesterId,
    "orderId": orderId,
    "closed": true
  };

  try {
    const endpoint = "netpunkt/close";

    const closeOrder = await context.fetch(`${url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(parameters),
      timeoutMs: 60000,
    });

    if (closeOrder.status === 200) {
      return { orderId: closeOrder.body.orderId };
    } else {
      return { status: "STATUS_NOT_200", };
    }

  } catch {
    log.error("CLOSE ORDER: Error closing order", { parameters });
    return { status: "ERROR_OCCURRED", };
  }
};

export { teamLabel };