import request from "superagent";
import config from "../config";

const { url, ttl , teamLabel } = config.datasources.vipcore;

export async function load(agencyId, context) {
  const res = await context?.fetch(
    `${url}/service/${agencyId}/userOrderParameters?trackingId=betabib`,
    { allowedErrorStatusCodes: [404] }
  );

  return res.body?.userOrderParameters;
}

export const options = {
  redis: {
    prefix: "vipcore-orderparams-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};
