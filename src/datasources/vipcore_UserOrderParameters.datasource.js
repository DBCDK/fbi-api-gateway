import request from "superagent";
import config from "../config";

const { url, ttl } = config.datasources.vipcore;

export async function load(agencyId) {
  return (
    await request.get(
      `${url}/service/${agencyId}/userOrderParameters?trackingId=betabib`
    )
  ).body.userOrderParameters;
}

export const options = {
  redis: {
    prefix: "vipcore-orderparams-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};
