import config from "../config";

const { url, ttl, prefix } = config.datasources.linkcheck;

export function restructureDate(data) {
  return Object.entries(data).map(([url, res]) => ({
    url,
    ...res,
  }));
}

/**
 * Fetch url state from service
 */
export async function load({ urls }, context) {
  console.log("hhhhhhhhhhhhhh hest", urls, `${url}/checks`);

  const res = await context.fetch(`${url}/checks`, {
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
