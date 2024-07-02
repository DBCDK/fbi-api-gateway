import config from "../config";

const { url, ttl } = config.datasources.vipcore;

function listMap(list) {
  const map = {};
  list.forEach((obj) => (map[obj.loginAgencyId] = obj));
  return map;
}

export async function load(_key, context) {
  const res = await context?.fetch(
    `${url}/borrowerchecklist/login.bib.dk/true?trackingId=betabib`,
    { allowedErrorStatusCodes: [] }
  );

  return listMap(res.body?.borrowerCheckLibrary);
}

export const options = {
  redis: {
    prefix: "vipcore-borrowerchecklist-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  },
};
