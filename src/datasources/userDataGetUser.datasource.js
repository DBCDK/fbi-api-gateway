import config from "../config";
import request from "superagent";

/**
 * Fetch user data form userdata service
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
  const addUserEndpoint = url + "user/get";
  const user = await request
    .post(addUserEndpoint)
    .send({ smaugUserId: smaugUserId });
  return user.body;
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
