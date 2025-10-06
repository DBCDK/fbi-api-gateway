import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.creatorInfo;

/**
 * Fetch creator by display name
 */
export async function load({ displayName }, context) {
  const endpoint = `${url}creator/display/${encodeURIComponent(displayName)}`;
console.log("\n\n\n INDO DISPLAY NAME endpoint", endpoint,'\n\n\n');
  const res = await context.fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  return res.body;
}

export const options = {
  redis: {
    ttl,
    prefix,
  },
};

export { teamLabel };


