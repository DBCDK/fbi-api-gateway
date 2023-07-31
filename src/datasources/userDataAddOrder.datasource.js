import config from "../config";
import request from "superagent";

/**
 * Add order in userdata service
 */
export async function load({ smaugUserId, orderId }, context) {
  const { url } = config.datasources.userdata;
  const addUserEndpoint = url + "user/order";
  await request
    .post(addUserEndpoint)
    .send({ smaugUserId: smaugUserId, orderId: orderId });
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
