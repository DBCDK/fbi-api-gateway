import config from "../config";

const { url, ttl, prefix } = config.datasources.linkcheck;

/**
 * Function to Restruture data from map to list
 */
export function restructureLinkStates(data) {
  try {
    return Object.entries(data).map(([url, res]) => ({
      url,
      ...res,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch url state from service
 */
export async function load({ urls }, context) {
  const res = await context.fetch(`${url}/checks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });

  return restructureLinkStates(res.body?.linkStates);
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24,
  },
};
