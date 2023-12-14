import config from "../config";

const { url, ttl } = config.datasources.openformat;

function parseResponse(response) {
  return splitResponse(response?.formatResponse?.refWorks[0]?.$);
}

function splitResponse(ref) {
  const parts = ref.split("RT Book");
  return parts.join("\nRT Book");
}

export async function load({ pids }, context) {
  const response = (
    await context?.fetch(
      `${url}?action=formatObject&pid=${pids.join(
        ","
      )}&outputFormat=refWorks&outputType=json`
    )
  ).body;
  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: "refworks-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
  },
};
