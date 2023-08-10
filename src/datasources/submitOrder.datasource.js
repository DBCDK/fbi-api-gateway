import config from "../config";
import { ACTIONS, auditTrace } from "@dbcdk/dbc-audittrail-logger";
import { log } from "dbc-node-logger";

const { serviceRequester, url, ttl, prefix } = config.datasources.openorder;

/**
 * Creates date three months in the future. Used if a date is not provided
 */
function createNeedBeforeDate() {
  let offsetInDays = 90;
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
export async function processRequest(input, postSoap, context) {
  // If id is found the user is authenticated via some agency
  // otherwise the token is anonymous
  const userIdFromToken = input.smaug.user.id;

  // Check if the user is authenticated on the given pickUpBranch
  const userIdAuthenticated =
    (userIdFromToken && input.branch.agencyId === input.smaug.user.agency) ||
    false;

  const userIdTypes = ["cpr", "userId", "barcode", "cardno", "customId"];
  // Use the userId from token, if user is authenticated,
  // otherwise the userId must be provided via args
  const userId = userIdAuthenticated
    ? ["userId", userIdFromToken]
    : Object.entries(input.userParameters).find(([key]) =>
        userIdTypes.includes(key)
      );

  if (!userId) {
    throw new Error(
      "User must be authenticated via the pickUpBranch, or provide userId manually"
    );
  }

  // filter out userid from user parameters - it is found above
  let userParameters = Object.entries(input.userParameters).filter(
    ([key]) => !userIdTypes.includes(key)
  );

  const postParameters = {
    copy: false,
    exactEdition: input.exactEdition || false,
    needBeforeDate: createNeedBeforeDate(),
    orderSystem: input.orderSystem,
    pickUpAgencyId: input.pickUpBranch,
    author: input.author,
    authorOfComponent: input.authorOfComponent,
    pagination: input.pagination,
    publicationDate: input.publicationDate,
    publicationDateOfComponent: input.publicationDateOfComponent,
    title: input.title,
    titleOfComponent: input.titleOfComponent,
    volume: input.volume,
    pid: input.pids.map((pid) => pid),
    serviceRequester: serviceRequester,
    trackingId: createTrackingId(),
    userId: userId[1],
    userIdAuthenticated: userIdAuthenticated,
    ...input.userParameters,
    verificationReferenceSource: "DBCDATAWELL",
  };

  // delete empties
  Object.keys(postParameters).forEach(
    (k) => postParameters[k] == null && delete postParameters[k]
  );

  if (!checkPost(postParameters)) {
    return null;
  }

  const res = await postSoap(postParameters, input, context);

  // some logging
  auditTrace(
    ACTIONS.write,
    config.app.id,
    input.smaug.app.ips,
    {
      login_token: input.accessToken,
    },
    `${userId[1]}/${input.branch.agencyId}`,
    {
      place_order: res?.body?.orderPlaced?.orderId,
    }
  );

  return res;
}

const checkPost = (post) => {
  //@TODO - more checks
  return post != null;
};

async function postSoap(post, input, context) {
  try {
    const order = await context.fetch(`${url}placeorder/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify(post),
    });
    return order;
  } catch (e) {
    log.error("SUBMIT ORDER: Error placing order", { post: post });
    // @TODO log
    return null;
  }
}

export async function load(input, context) {
  return processRequest(input, postSoap, context);
}
