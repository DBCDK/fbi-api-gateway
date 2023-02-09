import config from "../config";

export async function load({ q, limit = 5 }, context) {
  const { url } = config.datasources.didyoumean;

  const result = await context.fetch(
    `${url}/did-you-mean?q=${q?.all}&limit=${limit}`
  );

  return result.body?.response;
}
