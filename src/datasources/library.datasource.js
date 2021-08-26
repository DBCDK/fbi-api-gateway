import request from "superagent";
import config from "../config";
import { log } from "dbc-node-logger";

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
    log.error("Fetch work failed", { reason: error.message });
    // some error - return null
    return null;
  }
}
