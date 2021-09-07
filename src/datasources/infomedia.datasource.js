import request from "superagent";
import config from "../config";
import { log } from "dbc-node-logger";
import { getInfomediaDetails } from "../utils/utils";

const endpoint = "/infomedia";

export async function load({ pid, accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;
  const result = [];
  try {
    const article = (
      await request.post(url).send({
        access_token: accessToken,
        pid: pid,
      })
    ).body.data;

    //console.log(article, "ARTICLE");
    if (article && article[0]) {
      // get details from infomedia article
      const details = getInfomediaDetails(article[0]);
      result.push({ ...article[0], details });
    }

    return result[0];
  } catch (e) {
    log.error("Request to infomedia failed: " + url + " message: " + e.message);
    throw e;
    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}
