import request from "superagent";
import config from "../config";

const endpoint = "/order";

// object with default values - to be overridden by reals params
let orderObject = {
  fields: ["status", "orderId", "orsId", "deleted"],
  pretty: true,
  timings: true,
  orderType: "normal",
  pids: ["870970-basis:51989252"],
  delete: false,
};

/**
 * Merge default object with given input
 * @param input
 *  {SubmitOrderInput}
 * @param accessToken
 *  Token from openplatform
 * @return {*&{orderType: string, pretty: boolean, timings: boolean, fields: string[], pids: string[], delete: boolean}}
 *  i
 */
function setInputObject(input, accessToken) {
  // merge default object with given input
  let fullInput = { ...orderObject, ...input };
  // check expiry date - defaults to three months from now
  if (!fullInput.expires) {
    fullInput.expires = expireDate();
  }
  // access token
  fullInput.access_token = accessToken;
  // @TODO check values .. like are there any pids, pickupBranch .. etc

  return fullInput;
}

/**
 * Return date 3 months from now in format yyyy-mm-dd
 * @return Date as string
 */
function expireDate() {
  let date = new Date();
  let newDate = new Date(date.setMonth(date.getMonth() + 3));
  return newDate.toISOString().split("T")[0];
}

/**
 * Do the request
 * @param input
 * @param accessToken
 * @return {Promise<*>}
 */
export async function load({ input, accessToken }) {
  const realData = setInputObject(input, accessToken);

  const endpoint = "/order";
  const url = config.datasources.openplatform.url + endpoint;
  return (await request.post(url).send(realData)).body.data;
}
