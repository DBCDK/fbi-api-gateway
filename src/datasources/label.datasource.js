import config from "../config";

const { url, ttl, prefix, teamLabel } = config.datasources.metadataPresentation;

export function parseResponse(response) {
  return response?.body?.content || null;
}

export async function load({ pid }, context) {
  const response = await context.fetch(
    `${url}/presentations/label/${encodeURIComponent(pid)}`,
    {
      headers: {
        accept: "application/json",
      },
      allowedErrorStatusCodes: [404],
    }
  );

  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: prefix + "-label",
    ttl,
  },
};

export { teamLabel };
