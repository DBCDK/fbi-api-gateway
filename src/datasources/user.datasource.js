import request from "superagent";
import config from "../config";

/**
 * Fetch user info
 */
export async function load({ accessToken }) {
  const url = config.datasources.openplatform.url + "/user";
  const res = (
    await request.post(url).send({
      access_token: accessToken,
      userinfo: ["userData"],
    })
  ).body.data;

  return res;
}
