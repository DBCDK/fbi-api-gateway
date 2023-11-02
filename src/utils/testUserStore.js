/**
 * @file Redis Test User Store
 *
 * This file serves as a Redis store for managing test users. It is particularly useful
 * for creating test user scenarios where setting up a test environment is challenging, like:
 *
 * - nemlogin (where we don't have a test user)
 * - users on local libraries (where we for instance wants to be blocked)
 * - Merging different types of library accounts (FFU and Folkebibliotek) in Culr
 */

import { v5 as uuid } from "uuid";
import { set, get } from "../datasources/redis.datasource";
const TIME_TO_LIVE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Generate a key from context, used to store data in Redis
 */
const getKey = (context) => `test_user_1:${context.testUser.key}`;

/**
 * Generate uuid deterministically based on a string
 */
function uuidFromString(str, context) {
  return (
    "test:" +
    uuid(getKey(context) + str, "1b671a64-40d5-491e-99b0-da01ff1f3341")
  );
}

/**
 * Store test user object in Redis
 */
export async function storeTestUser(object, context) {
  const getLoader = context?.datasources?.getLoader || context.getLoader;

  await set(getKey(context), TIME_TO_LIVE_SECONDS, object);

  // Clear redis entries
  await getLoader("userinfo").clearRedis({ accessToken: context.accessToken });
  if (object?.accounts.length > 0) {
    await Promise.all(
      object.accounts.map(async (account) => {
        await getLoader("borchk").clearRedis({
          userId: "123456",
          libraryCode: account.agency,
        });
      })
    );
  }
}

/**
 * Get test user object from Redis, and create a proper structured
 * test user object.
 */
export async function getTestUser(context) {
  let res = (await get(getKey(context)))?.val;

  // Get info for login agency
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

  if (!res?.accounts?.find((account) => account.agency === agencyId)) {
    res.accounts.push({ agency: agencyId, cpr });
    await storeTestUser(res, context);
  }

  res.accounts = res.accounts?.map((account) => ({
    ...account,
    localId,
    uniqueId: uuidFromString(account.cpr || account.agency || "", context),
  }));
  res.loginAgency = res?.accounts?.find(
    (account) => account.agency === agencyId
  );
  res.merged = res.accounts.filter(
    (account) => account.uniqueId === res.loginAgency.uniqueId
  );

  return res;
}

/**
 * Create accounts in Culr format
 */
export function accountsToCulr(accounts) {
  const res = [];
  accounts.forEach((account) => {
    res.push({
      agencyId: account.agency,
      userId: account.localId,
      userIdType: "LOCAL",
    });
    if (account.cpr) {
      res.push({
        agencyId: account.agency,
        userId: account.cpr,
        userIdType: "CPR",
      });
    }
  });
  return res;
}

export function parseTestToken(token) {
  const [testTokenType, accessToken] = token.split(":");
  const [_test, loginAgency, key] = testTokenType.split("_");
  return {
    accessToken,
    testUser: {
      loginAgency,
      key,
    },
  };
}
