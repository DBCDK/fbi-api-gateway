import config from "../config";

const { url, teamLabel } = config.datasources.vipcore;

export async function load({ branchId }, context) {
  const res = await context?.fetch(`${url}/service`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agencyId: branchId, service: "serverInformation" }),
  });

  return res?.body?.serverInformation?.address;
}

export const options = {
  // Enable per-request debugging for this datasource when "x-debug: true" is set
  allowDebug: true,
  redis: {
    prefix: "detailedHoldingsSupported-1",
    ttl: 60 * 15, // cache for 15 minutes
  },
};

export { teamLabel };
