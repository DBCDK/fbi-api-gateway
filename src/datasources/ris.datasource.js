import config from "../config";

const { url, ttl, prefix, teamLabel } = config.datasources.referencePresentation;

export function parseResponse(response) {
  return response?.body?.content?.["reference-data"] || "";
}

export async function load({ pids }, context) {
  const risRecords = await Promise.all(
    pids.map(async (pid) => {
      const response = await context.fetch(
        `${url}/presentations/ris/${encodeURIComponent(pid)}`,
        {
          headers: {
            accept: "application/json",
          },
          allowedErrorStatusCodes: [404],
        }
      );

      return parseResponse(response);
    })
  );

  return risRecords.filter(Boolean).join("\n");
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
