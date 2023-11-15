/**
 * @file Get specific suggestions (by index/type) for complex search
 *
 */

import config from "../config";

const { url, prefix, ttl } = config.datasources.complexsearchsuggest;

export async function load({ q, type }, context) {
  console.log("COMPLEX SUGGEST");

  const res = await context.fetch(
    `${url}?${new URLSearchParams({
      q: q,
      type: type,
    })}`
  );

  const body = res.body;

  console.log(body, "BODY");

  if (Array.isArray(body)) {
    return body;
  }

  return body.response;
}

/*export const options = {
  redis: {
    prefix,
    ttl,
  },
};*/
