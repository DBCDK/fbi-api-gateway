import config from "../config";

const { url, ttl } = config.datasources.openformat;

function parseResponse(response) {
  return response?.formatResponse?.ris[0]?.$ || "ERROR";
}

export async function load({ pids }, context) {
  const response = (await context.fetch(`${url}?action=formatObject&pid=${pids.join(",")}&outputFormat=ris&outputType=json`)).body;
  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: "ris-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
  },
};
