import config from "../config";
import request from "superagent";

/**
 * Fetch user info
 */
export async function load({ smaugUserId }, context) {
  const { url } = config.datasources.userdata;
  console.log("\nurl: ", url);
  const GUID = smaugUserId || "hejhejhej";
  const addUserEndpoint = url + "user/add";
  console.log("addUserEndpoint", addUserEndpoint);

  const user = await request.post(addUserEndpoint).send({ smaugUserId: GUID });
  console.log("user", user);
  //const url = "https://login.bib.dk/userinfo";
  //   const res = await context?.fetch(url, {
  //     headers: { Authorization: `Bearer ${accessToken}` },
  //     allowedErrorStatusCodes: [401],
  //   });

  return user; //"messi"
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
