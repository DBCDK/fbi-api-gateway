import config from "../config";
import request from "superagent";

/**
 * Delete user from userdata service
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
  const addUserEndpoint = url + "user";
  await request.delete(addUserEndpoint).send({ smaugUserId: smaugUserId });
}

export const options = {
  redis: {
    prefix: "userinfo"
},
};
