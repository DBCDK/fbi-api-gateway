import request from "superagent";
import config from "../config";

const endpoint = "/libraries";
export async function load(agencyid) {
  // @TODO access token ??
  const url = config.datasources.openplatform.url + endpoint;
  return (
    await request.post(url).send({
      access_token: "qwerty",
      agencyIds: [`${agencyid.q}`],
    })
  ).body.data;
}
