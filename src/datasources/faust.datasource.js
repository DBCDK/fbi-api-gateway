/**
 * @file Mapping faust to work id
 */

// import request from "superagent";
// import config from "../config";

// const { url, prefix, ttl, token } = config.datasources.faustservice;

export async function load(faust) {
  // Until we have a service for mapping faust to work id
  return `work-of:870970-basis:${faust}`;
}

// export const options = {
//   redis: {
//     prefix,
//     ttl,
//   },
// };
