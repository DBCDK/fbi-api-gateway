import config from "../config";

const { url, ttl } = config.datasources.vipcore;

export async function load(_key, context) {
  const res = await context?.fetch(
    `${url}/borrowerchecklist/login.bib.dk/true?trackingId=betabib`,
    { allowedErrorStatusCodes: [] }
  );

  return res.body?.borrowerCheckLibrary;
}

export const options = {
  redis: {
    prefix: "vipcore-borrowerchecklist-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};
