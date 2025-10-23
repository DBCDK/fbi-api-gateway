import config from "../config";
import { ACTIONS, auditTrace } from "@dbcdk/dbc-audittrail-logger";
import { log } from "dbc-node-logger";
import { getUserIdTypeValuePair } from "../utils/getUserBorrowerStatus";

const { serviceRequester, url, teamLabel } = config.datasources.openorder;

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
  /* If user credentials are available in userParameters, we select an ID type and value from the parameters. 
    If multiple ID types are present, we choose only one based on a prioritized list. */
  const id = getUserIdTypeValuePair(input?.userParameters);
  let userIdType = id?.type;

  // Valid userId types https://openorder.addi.dk/3.0?xsd=1
  const validUserIdTypes = ["cpr", "common", "barcode", "cardno", "optional"];

  // TODO how do we fix this the right way? "userId" should probably not be part of the schema
  // Openorder doesn't accept userIdType="userId"
  // We set userIdType to null, when  given type is invalid
  if (!validUserIdTypes.includes(userIdType)) {
    userIdType = null;
  }

  // Set order parameters
  const params = {
    copy: false,
    exactEdition: input.exactEdition || false,
    needBeforeDate: input.expires || createNeedBeforeDate(),
    orderSystem: orderSystem?.toUpperCase(),
    pickUpAgencyId: input.pickUpBranch,
    pickUpAgencySubdivision: input.pickUpBranchSubdivision,
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
    userId: userId || id?.value,
    userIdType,
    verificationReferenceSource: "DBCDATAWELL",
    requesterInitials: input.requesterInitials,
    responderId: input.responderId,
    placeOnHold: input.placeOnHold,
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
  { userId, input, branch, accessToken, smaug, authUserId, caller = "bibdk" },
  context
) {
  const orderSystem = smaug?.orderSystem;
  // build parameters for service request
  const parameters = buildParameters({ userId, input, orderSystem });

  const endpoint =
    caller === "netpunkt" ? "netpunkt/placeorder/" : "placeorder/";

  try {
    const order = await context.fetch(`${url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(parameters),
      timeoutMs: 60000,
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

    const parsedOrder = parseOrder(order);

    context?.dataHub?.createSubmitOrderEvent({
      input,
      order: parsedOrder,
    });

    return parsedOrder;
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

export const options = {
  allowDebug: true,
};

export { teamLabel };
