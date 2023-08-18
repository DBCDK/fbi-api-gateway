/**
 * @file This file tests the complexity estimator function, which is evaluated in in graphql validator
 *
 */

import { getExecutableSchema } from "../schemaLoader";

import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

let internalSchema;
describe("Culr", () => {
  beforeEach(async () => {
    if (!internalSchema) {
      internalSchema = await getExecutableSchema({
        loadExternal: false,
        clientPermissions: { admin: true },
      });
    }
  });

  const createAccount = `
    mutation Example_CreateAccount($input: CreateAccountInput!) {
        culr {
            createAccount(input: $input, dryRun: true) {
                status
            }
        }
    } `;

  it("Should give status ERROR_UNAUTHENTICATED_TOKEN", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          agencyId: "800010",
          localId: "C012345678",
          cpr: "0123456789",
        },
      },
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "UNAUTHENTICATED_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        culr: {
          createAccount: {
            status: "ERROR_UNAUTHENTICATED_TOKEN",
          },
        },
      },
    });
  });

  it("Should give status ERROR_INVALID_CPR", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          agencyId: "800010",
          localId: "C012345678",
          cpr: "1234",
        },
      },
      context: {
        smaug: { user: { id: "0102033690" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        culr: {
          createAccount: {
            status: "ERROR_INVALID_CPR",
          },
        },
      },
    });
  });

  it("Should give status ERROR_INVALID_AGENCY", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          agencyId: "123456",
          localId: "C012345678",
          cpr: "0102033690",
        },
      },
      context: {
        smaug: { user: { id: "0102033690" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        culr: {
          createAccount: {
            status: "ERROR_INVALID_AGENCY",
          },
        },
      },
    });
  });

  it("Should give status ERROR_USER_ALREADY_CREATED", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          agencyId: "812345",
          localId: "C000000001",
          cpr: "0102033690",
        },
      },
      context: {
        smaug: { user: { id: "0102033690" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
      },
    });

    console.error("vvvv", result);

    expect(result).toEqual({
      data: {
        culr: {
          createAccount: {
            status: "ERROR_USER_ALREADY_CREATED",
          },
        },
      },
    });
  });
});
