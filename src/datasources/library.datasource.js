import request from "superagent";
import config from "../config";

const endpoint = "/libraries";

export async function load({ agencyid, accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;
  const library = agencyid ? { agencyIds: [agencyid] } : null;
  let args = { access_token: accessToken };
  if (library) {
    args = { ...args, ...library };
  }
  try {
    return (await request.post(url).send(args)).body.data;
  } catch (error) {
    console.log(error);
    // if error or not a part of a series (404)
    return null;
  }
}
