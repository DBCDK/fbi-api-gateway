import config from "../config";

const { url, ttl, prefix, teamLabel, disabled } = config.datasources.linkcheck;

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
  if (disabled) {
    // Linkcheck is disabled for some reason - see environment - fake the data with status OK
    const data = urls.map((url) => ({ url: url, status: "OK" }));
    return restructureLinkStates(data);
  }
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

export { teamLabel };
