import request from "superagent";
import config from "../config";

/**
 * Fetch user info
 */
export async function load({ accessToken }) {
  const url = config.datasources.openplatform.url + "/user";
  return (
    await request.post(url).send({
      access_token: accessToken,
      userinfo: ["userLoan"],
    })
  ).body.data;
}
