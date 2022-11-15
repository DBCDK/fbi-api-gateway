import request from "superagent";
import config from "../config";
import { log } from "dbc-node-logger";

function parseResponse(text) {
  try {
    const covers = JSON.parse(text);
    return covers?.response.map((cover) => {
      return {
        detail:
          config.datasources.defaultforsider.url + "large/" + cover + ".jpg",
        origin: "default",
      };
    });
  } catch (e) {
    return [{}];
  }
}

/**
 * Fetch default covers
 */
export async function load({ coverParams }) {
  const url = config.datasources.defaultforsider.url + "defaultcover/";
  try {
    const covers = await request
      .post(url)
      .set("Content-Type", "application/json")
      .send({ coverParams: coverParams });

    return parseResponse(covers?.text);
  } catch (e) {
    log.error(e.message);
    console.log(e.message, "ERROR");
  }
}
