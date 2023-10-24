/**
 * @file a mocked culr that uses Redis as data store
 */
import { v5 as uuid } from "uuid";
import { set, get } from "../datasources/redis.datasource";
const TIME_TO_LIVE_SECONDS = 60 * 60 * 24 * 30;

/*
 * Generate a key from context, used to store data in Redis
 */
const getKey = (context) => `test_user_1:${context.testUser.key}`;

// Generate uuid deterministically based on a string
function uuidFromString(str, context) {
  return (
    "test:" +
    uuid(getKey(context) + str, "1b671a64-40d5-491e-99b0-da01ff1f3341")
  );
}

export async function storeTestUser(object, context) {
  await set(getKey(context), TIME_TO_LIVE_SECONDS, object);
}

export async function getTestUser(context) {
  let res = (await get(getKey(context)))?.val;

  const branch = (
    await (context?.datasources?.getLoader || context.getLoader)(
      "library"
    ).load({
      branchId: context.testUser.loginAgency,
      status: "ALLE",
    })
  ).result[0];

  if (!res?.accounts) {
    res = { accounts: [] };
  }

  const agencyId = branch?.agencyId || "190101";
  const cpr = branch?.agencyId ? null : "0101011234";
  const localId = "123456";

  if (!res?.accounts?.find((reg) => reg.agency === agencyId)) {
    res.accounts.push({ agency: agencyId, cpr });
    await storeTestUser(res, context);
  }

  res.accounts = res.accounts?.map((reg) => ({
    ...reg,
    localId,
    uniqueId: uuidFromString(reg.cpr || reg.agency || "", context),
  }));
  res.loginAgency = res?.accounts?.find((reg) => reg.agency === agencyId);
  res.merged = res.accounts.filter(
    (reg) => reg.uniqueId === res.loginAgency.uniqueId
  );
  res.culrAgencies = accountsToCulr(res.merged);

  return res;
}

function accountsToCulr(accounts) {
  const res = [];
  accounts.forEach((reg) => {
    res.push({
      agencyId: reg.agency,
      userId: reg.localId,
      userIdType: "LOCAL",
    });
    if (reg.cpr) {
      res.push({
        agencyId: reg.agency,
        userId: reg.cpr,
        userIdType: "CPR",
      });
    }
  });
  return res;
}
