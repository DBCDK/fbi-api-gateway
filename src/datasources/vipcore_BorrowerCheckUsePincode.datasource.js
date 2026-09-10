import config from "../config";

const { url, ttl, teamLabel } = config.datasources.vipcore;

export async function load(libraryId, context) {
  const res = await context?.fetch(`${url}/borchk/${libraryId}/`, {
    allowedErrorStatusCodes: [],
  });

  return !!res.body?.usePincode;
}

export const options = {
  redis: {
    prefix: "vipcore-borrowercheck-use-pincode-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};

export { teamLabel };
