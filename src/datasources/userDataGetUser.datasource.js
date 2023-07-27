import config from "../config";
import request from "superagent";

/**
 * Fetch user info
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
  console.log("\nurl: ", url);
  const GUID = smaugUserId || "hejhejhej";
  const addUserEndpoint = url + "user/get";
  console.log("getuser", addUserEndpoint);

  const user = await request.post(addUserEndpoint).send({ smaugUserId: GUID });
  console.log("user", user.body);

  return user.body; //"messi"
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
