import config from "../config";
import { ACTIONS, auditTrace } from "@dbcdk/dbc-audittrail-logger";
import { log } from "dbc-node-logger";

const { serviceRequester, url } = config.datasources.openorder;

/**
 * Creates date three months in the future. Used if a date is not provided
 */
function createNeedBeforeDate() {
  let offsetInDays = 180;
  let offsetInMilliseconds = offsetInDays * 24 * 60 * 60 * 1000;
  let date = new Date(Date.now() + offsetInMilliseconds);
  let dateStr = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(
    -2
  )}-${("0" + date.getDate()).slice(-2)}T00:00:00`;
  return dateStr;
}

function createTrackingId() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Handle the request. Merge given input and fixed parameters for a post request.
 *
 * @param input
 *  input from query
 * @param postSoap
 *  the function to fetch data
 * @param context
 * @returns {Promise<*|null>}
 */
export function buildParameters({ userId, input, orderSystem }) {
  // Set order parameters
  const params = {
    copy: false,
    exactEdition: input.exactEdition || false,
    needBeforeDate: input.expires || createNeedBeforeDate(),
    orderSystem: orderSystem?.toUpperCase(),
    pickUpAgencyId: input.pickUpBranch,
    author: input.author,
    authorOfComponent: input.authorOfComponent,
    pagination: input.pagesOfComponent,
    publicationDate: input.publicationDate,
    publicationDateOfComponent: input.publicationDateOfComponent,
    title: input.title,
    titleOfComponent: input.titleOfComponent,
    volume: input.volumeOfComponent,
    pid: input.pids.map((pid) => pid),
    serviceRequester: serviceRequester,
    trackingId: createTrackingId(),
    ...input.userParameters,
    userId: userId || input.userParameters.userId,
    verificationReferenceSource: "DBCDATAWELL",
  };

  // delete empty params
  Object.keys(params).forEach((k) => params[k] == null && delete params[k]);

  return params;
}

const checkPost = (post) => {
  //@TODO - more checks
  return post != null;
};

export function parseOrder(orderFromService) {
  try {
    return {
      ok: orderFromService?.ok || false,
      status: orderFromService?.body?.orderPlaced?.orderPlacedMessage || null,
      orderId: orderFromService?.body?.orderPlaced?.orderId || null,
    };
  } catch {}
}

/**
 * @param props
 * @param props.input {obj}
 * @param props.accessToken {string}
 * @param props.smaug {obj}
 * @param props.branch {obj}
 * @param context
 */

export async function load(
  { userId, input, branch, accessToken, smaug, authUserId },
  context
) {
  const orderSystem = smaug?.orderSystem;
  // build parameters for service request
  const parameters = buildParameters({ userId, input, orderSystem });

  try {
    const order = await context.fetch(`${url}placeorder/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(parameters),
    });

    if (!checkPost(parameters)) {
      return null;
    }

    // userID for log trace
    const _userId = authUserId || userId;

    // some logging
    auditTrace(
      ACTIONS.write,
      config.app.id,
      smaug.app.ips,
      {
        login_token: accessToken,
      },
      `${_userId}/${branch.agencyId}`,
      {
        place_order: order?.body?.orderPlaced?.orderId,
      }
    );

    // Logging for analytics
    context?.tracking?.collect({
      action: "ORDER",
      pids: input?.pids,
      pickUpBranch: input?.pickUpBranch,
      orderSystem,
    });

    return parseOrder(order);
  } catch (e) {
    log.error("SUBMIT ORDER: Error placing order", { parameters });
    return null;
  }
}

export async function testLoad({ input }, context) {
  return {
    ok: true,
    status: "",
    orderId: JSON.stringify(input),
  };
}
