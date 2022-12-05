/**
 * @file default covers datasource
 *
 * NOTE - a response may look like :
 * {
 * "response":
 * [
 * {"thumbNail":"thumbnail/3a026499-d371-509d-8c0c-6d526b7236f8.jpg","detail":"large/3a026499-d371-509d-8c0c-6d526b7236f8.jpg"},
 * {"thumbNail":"thumbnail/619fcbe3-cbd7-5caf-b059-8ec771496371.jpg","detail":"large/619fcbe3-cbd7-5caf-b059-8ec771496371.jpg"},
 * {"thumbNail":"thumbnail/be0df50e-af4e-5579-98b6-701ab8d6abe7.jpg","detail":"large/be0df50e-af4e-5579-98b6-701ab8d6abe7.jpg"},
 * {"error":"not supported materialType:fisk"}
 * ]
 * }
 */

import request from "superagent";
import config from "../config";
import { log } from "dbc-node-logger";

const { url, ttl, prefix } = config.datasources.defaultforsider;

function parseResponse(text) {
  try {
    const covers = JSON.parse(text);
    return covers?.response.map((cover) => {
      return {
        detail: `${url}${cover?.detail || null}`,
        thumbnail: `${config.datasources.defaultforsider.url}${
          cover?.thumbNail || null
        }`,
        origin: "default",
      };
    });
  } catch (e) {
    log.error(e.message);
    return {};
  }
}

/**
 * Fetch default cover (GET)
 */
export async function load(coverParams) {
  const url = config.datasources.defaultforsider.url + "defaultcover";
  try {
    const covers = await request.get(url).query(coverParams);
    return parseResponse(covers?.text);
  } catch (e) {
    log.error(e.message);
  }
}

export async function batchLoader(keys, loadFunc) {
  const url = config.datasources.defaultforsider.url + "defaultcover/";

  try {
    const covers = await request
      .post(url)
      .set("Content-Type", "application/json")
      .send(keys);
    return parseResponse(covers?.text);
  } catch (e) {
    log.error(e.message);
    return keys.map(() => ({}));
  }
}

// export const options = {
//   redis: {
//     prefix: prefix,
//     ttl: ttl,
//     staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
//   },
// };
