import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.creatorInfo;

/**
 * Fetch creator by VIAF id
 */
export async function load({ viafid }, context) {
  const endpoint = `${url}creator/viafid/${encodeURIComponent(viafid)}`;

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
