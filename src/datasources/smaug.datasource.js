import request from "superagent";
import config from "../config";

/**
 * Fetch smaug configuration
 */
export async function load({ accessToken }) {
  return (
    await request.get(
      `${config.datasources.smaug.url}/configuration?token=${accessToken}`
    )
  ).body;
}
