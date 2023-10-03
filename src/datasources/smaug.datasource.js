import config from "../config";
import { createAccount, getAccountsByLocalId } from "../utils/redisTestCulr";

/**
 * Fetch smaug configuration
 */
export async function load({ accessToken }, context) {
  const res = await context.fetch(
    `${config.datasources.smaug.url}/configuration?token=${accessToken}`,
    { allowedErrorStatusCodes: [404] }
  );

  return res.body;
}

/*
 * Simulate a user by creating a fake uniqueId associated with the access token
 */
export async function testLoad({ accessToken }, context) {
  // We still want to load smaug configuration from the real smaug
  const configuration = await load({ accessToken }, context);

  if (configuration) {
    const branch = (
      await context.getLoader("library").load({
        branchId: context.testUser.loginAgency,
        status: "ALLE",
      })
    ).result[0];

    // We use the same localId everywhere
    const localId = "123456";
    const cpr =
      branch.agencyType === "Forskningsbibliotek" ? null : "0101011234";

    const agencyId = branch.agencyId;

    let patron = await getAccountsByLocalId({ agencyId, localId }, context);

    if (patron) {
      await createAccount({ agencyId, localId, cpr }, context);
      patron = await getAccountsByLocalId({ agencyId, localId }, context);
    }
    configuration.user = { uniqueId: patron.guid, id: cpr, agencyId };
  }

  return configuration;
}

export const options = {
  redis: {
    prefix: "smaug-1",
    ttl: 10, // 10 seconds
  },
};
