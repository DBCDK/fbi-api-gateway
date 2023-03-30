import config from "../config";

const { url, ttl, prefix } = config.datasources.linkcheck;

export function restructureDate(data) {
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
  let res;

  res = await context.fetch(`${url}/checks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });

  return restructureDate(res.body.linkStates);
}

// export const options = {
//   redis: {
//     prefix,
//     ttl,
//     staleWhileRevalidate: 60 * 60 * 24, // 24 hours
//   },
// };
