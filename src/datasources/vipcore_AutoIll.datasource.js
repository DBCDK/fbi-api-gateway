import config from "../config";

const { url, ttl } = config.datasources.vipcore;

/**
 * Find auto ill parameters for given agency
 * @param automationParams
 * @param agencyId
 * @returns {*}
 */
function agencyIll(automationParams, agencyId) {
  return automationParams.find((autoill) => autoill?.provider === agencyId);
}

export async function load(agencyId, context) {
  const res = await context?.fetch(`${url}/autoillparams/${agencyId}`, {
    allowedErrorStatusCodes: [],
  });

  return agencyIll(res.body?.automationParams, agencyId);
}

export const options = {
  redis: {
    prefix: "vipcore-autoill-2",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};
