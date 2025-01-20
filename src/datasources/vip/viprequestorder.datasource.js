import config from "../../config";

const { url, ttl } = config.datasources.vipcore;

export async function load(agencyId, context) {
  const res = await context?.fetch(`${url}/requestorder/${agencyId}/`, {
    allowedErrorStatusCodes: [],
  });

  return res?.body;
}

export const options = {
  // redis: {
  //   prefix: "vipcore-requestorder-2",
  //   ttl,
  //   staleWhileRevalidate: 60 * 60 * 24, // 1 day
  // },
};
