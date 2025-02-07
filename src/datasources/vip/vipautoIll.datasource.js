import config from "../../config";

const { url, ttl, teamLabel } = config.datasources.vipcore;

export async function load(agencyId, context) {
  const res = await context?.fetch(
    `${url}/autoillparams/${agencyId ? agencyId : ""}`,
    {
      allowedErrorStatusCodes: [],
    }
  );

  return res?.body;
}

export const options = {
  redis: {
    prefix: "vipcore-autoill-2",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};

export { teamLabel };
