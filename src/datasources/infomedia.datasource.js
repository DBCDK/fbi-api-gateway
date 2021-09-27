import request from "superagent";
import config from "../config";
import { log } from "dbc-node-logger";
import { getInfomediaDetails } from "../utils/utils";

const endpoint = "/infomedia";

export async function load({ pid, accessToken }) {
  const url = config.datasources.openplatform.url + endpoint;
  const result = [];
  try {
    const articles = (
      await request.post(url).send({
        access_token: accessToken,
        pid: pid,
      })
    ).body.data;

    if (articles && articles[0]) {
      articles.forEach((article) => {
        // get details from infomedia article
        let details = getInfomediaDetails(article);
        result.push({ ...article, details });
      });
    }
    return result;
  } catch (e) {
    log.error("Request to infomedia failed: " + url + " message: " + e.message);
    throw e;
    // @TODO what to return here - i made this one up
    // return "internal_error";
  }
}

// cache for an hour
export const options = {
  redis: {
    prefix: "infomedia-1",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};
