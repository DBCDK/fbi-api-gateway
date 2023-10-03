/**
 * @file a mocked culr that uses Redis as data store
 */
import { v5 as uuid } from "uuid";
import { set, get } from "../datasources/redis.datasource";
const TIME_TO_LIVE_SECONDS = 60 * 60 * 24 * 30;

/*
 * Generate a key from context, used to store data in Redis
 */
const getKey = (context) => `mocked_culr_2${context.testUser.key}`;

// Generate uuid deterministically based on a string
function uuidFromString(str, context) {
  return uuid(getKey(context) + str, "1b671a64-40d5-491e-99b0-da01ff1f3341");
}

/*
 * Create account in Culr
 */
export async function createAccount({ agencyId, localId, cpr }, context) {
  const allAccounts = (await get(getKey(context)))?.val || [];

  const account = allAccounts?.find(
    (account) =>
      account.agencyId === agencyId &&
      account.localId === localId &&
      account.cpr === cpr
  );

  if (account) {
    return { code: "ACCOUNT_EXISTS" };
  }

  allAccounts.push({ agencyId, localId, cpr });

  await set(getKey(context), TIME_TO_LIVE_SECONDS, allAccounts);

  return { code: "OK200" };
}

/*
 * Look up all accounts for user
 */
export async function getAccountsByLocalId({ agencyId, localId }, context) {
  const allAccounts = (await get(getKey(context)))?.val || [];

  const account = allAccounts?.find?.(
    (account) => account.agencyId === agencyId && account.localId === localId
  );

  if (!account) {
    return { code: "ACCOUNT_DOES_NOT_EXIST" };
  }

  const accountsForUser = account?.cpr
    ? allAccounts.filter((entry) => entry.cpr === account.cpr)
    : [account];

  let parsedAccounts = [];

  accountsForUser.forEach(
    (account) =>
      (parsedAccounts = [...parsedAccounts, ...parseAccount(account)])
  );

  return {
    accounts: parsedAccounts,
    municipalityNo: "151",
    guid:
      "test:" +
      (account?.cpr
        ? uuidFromString(account?.cpr, context)
        : uuidFromString(account.agencyId + account.localId, context)),
    code: "OK200",
  };
}

/*
 * Delete account
 */
export async function deleteAccount({ agencyId, localId }, context) {
  const allAccounts = (await get(getKey(context)))?.val || [];

  const filteredAccounts = allAccounts.filter(
    (account) => !(account.localId === localId && account.agencyId === agencyId)
  );

  if (allAccounts.length === filteredAccounts.length) {
    return { code: "ACCOUNT_DOES_NOT_EXIST" };
  }

  await set(getKey(context), TIME_TO_LIVE_SECONDS, filteredAccounts);

  return { code: "OK200" };
}

/*
 * Parse account stored in Redis, into the expected Culr format
 */
function parseAccount(account) {
  const res = [
    {
      agencyId: account.agencyId,
      userIdType: "LOCAL",
      userIdValue: account.localId,
    },
  ];

  if (account.cpr) {
    res.push({
      agencyId: account.agencyId,
      userIdType: "CPR",
      userIdValue: account.cpr,
    });
  }
  return res;
}
