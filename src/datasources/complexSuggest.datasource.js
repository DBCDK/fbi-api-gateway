/**
 * @file Get specific suggestions (by index/type) for complex search
 *
 */

import config from "../config";

const { url, prefix, ttl , teamLabel } = config.datasources.complexsearchsuggest;

export async function load({ q, type }, context) {
  const res = await context.fetch(
    `${url}?${new URLSearchParams({
      q: q,
      type: type.toLowerCase(),
    })}`
  );

  return res?.body?.response;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
