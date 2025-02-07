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

import config from "../config";

import { createSigner } from "fast-jwt";

const { url, secret , teamLabel } = config.datasources.defaultforsider;

const signSync = createSigner({ key: secret });

function parseResponse(key) {
  try {
    const signedJwt = signSync(key);
    return {
      detail: `${url}large/${signedJwt}`,
      thumbnail: `${url}thumbnail/${signedJwt}`,
      origin: "default",
    };
  } catch (e) {
    return {};
  }
}

export async function batchLoader(keys, context) {
  return keys.map((key) => parseResponse(key));
}
