/**
 * @file This file tests the handeling of the culr service responses
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
    mutation Test_CreateAccount($input: CreateAccountInput!) {
        culr {
            createAccount(input: $input, dryRun: false) {
                status
            }
        }
    } `;

  const deleteAccount = `
    mutation Test_DeleteAccount($input: DeleteAccountInput!) {
        culr {
            deleteAccount(input: $input, dryRun: false) {
                status
            }
        }
    } `;

  const getAccounts = `
    query Test_GetAccounts($input: GetAccountsInput) {
      culr {
        getAccounts(input: $input) {
          municipalityNo
          guid
          accounts {
            agencyId
            userIdType
            userIdValue
          }
        }
      }
    } `;

  it("CreateAccount | Should give status ERROR_UNAUTHENTICATED_TOKEN", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
          },
        },
      },
      context: {
        user: null,
        smaug: {},
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

  it("CreateAccount | Should give status ERROR_INVALID_CPR", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
            folk: "ANONYMOUS_TOKEN",
          },
        },
      },
      context: {
        smaug: {},
        user: { userId: "some-random-not-cpr" },
        datasources: createMockedDataLoaders(),
        accessToken: "DUMMY_TOKEN",
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

  it("CreateAccount | Should give status ERROR_CPR_MISMATCH", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
            folk: "AUTHENTICATED_TOKEN_USER1",
          },
        },
      },
      context: {
        smaug: {},
        user: { userId: "some-id" },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN_USER2",
      },
    });

    expect(result).toEqual({
      data: {
        culr: {
          createAccount: {
            status: "ERROR_CPR_MISMATCH",
          },
        },
      },
    });
  });

  it.only("CreateAccount | Should give status ERROR_INVALID_AGENCY", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "AUTHENTICATED_TOKEN_USER2",
          },
        },
      },
      context: {
        smaug: {},
        user: { userId: "some-id" },
        datasources: createMockedDataLoaders(),
        accessToken: "DUMMY_TOKEN",
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

  it("CreateAccount | Should give status ERROR_USER_ALREADY_CREATED", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
            folk: "AUTHENTICATED_TOKEN_USER2",
          },
        },
      },
      context: {
        smaug: {},
        user: { userId: "some-id" },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN_USER2",
      },
    });

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

  it("CreateAccount | Should give status OK - successfully created account", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
            folk: "AUTHENTICATED_TOKEN_USER1",
          },
        },
      },
      context: {
        smaug: {},
        user: { userId: "some-id" },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN_USER1",
      },
    });

    expect(result).toEqual({
      data: {
        culr: {
          createAccount: {
            status: "OK",
          },
        },
      },
    });
  });

  it("GetAccounts | Should give status ERROR_ACCOUNT_DOES_NOT_EXIST on provided token", async () => {
    const result = await performTestQuery({
      query: getAccounts,
      variables: {
        input: {
          accessToken: "DUMMY_TOKEN_NO_ACCOUNTS",
        },
      },
      context: {
        smaug: {},
        user: { userId: "some-id" },
        datasources: createMockedDataLoaders(),
        accessToken: "DUMMY_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        culr: {
          getAccounts: null,
        },
      },
    });
  });
});
