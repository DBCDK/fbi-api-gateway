import request from "superagent";
import config from "../config";

const endpoint = "/infomedia";
export async function load({ pid, accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;

  return (
    await request.post(url).send({
      access_token: accessToken,
      pid: pid,
    })
  ).body.data;
}
