import config from "../config";
import request from "superagent";

/**
 * Fetch user info
 */
export async function load({ smaugUserId, orderId }, context) {
  const { url } = config.datasources.userdata;
  console.log("\nurl: ", url);
  const GUID = smaugUserId || "hejhejhej";
  const addUserEndpoint = url + "user/order";
  console.log("addUserEndpoint", addUserEndpoint);

  const user = await request
    .post(addUserEndpoint)
    .send({ smaugUserId: GUID, orderId: orderId });
  return user; //"messi"
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
