import config from "../config";

const { teamLabel, url } = config.datasources.didyoumean;

export async function load({ q, limit = 5 }, context) {
  const result = await context.fetch(
    `${url}/did-you-mean?q=${q?.all}&limit=${limit}`
  );

  return result.body?.response;
}

export { teamLabel };
