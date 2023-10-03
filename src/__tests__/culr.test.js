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
    mutation Test_GetAccounts($input: GetAccountsInput) {
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
            folk: "FOLK_UNAUTHENTICATED_TOKEN",
          },
        },
      },
      context: {
        smaug: { user: { id: "1234" } },
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

  it("CreateAccount | Should give status ERROR_CPR_MISMATCH", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
            folk: "FOLK_MISMATCH_CPR_TOKEN",
          },
        },
      },
      context: {
        smaug: { user: { id: "0102033692" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
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

  it("CreateAccount | Should give status ERROR_INVALID_AGENCY", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FOLK_AUTHENTICATED_TOKEN",
          },
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

  it("CreateAccount | Should give status ERROR_USER_ALREADY_CREATED", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          tokens: {
            ffu: "FFU_AUTHENTICATED_TOKEN",
            folk: "FOLK_AUTHENTICATED_TOKEN",
          },
        },
      },
      context: {
        smaug: { user: { id: "0102033692" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
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
            folk: "FOLK_AUTHENTICATED_TOKEN_SUCCES",
          },
        },
      },
      context: {
        smaug: { user: { id: "0102033690" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN_SUCCES",
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
          accessToken: "AUTHENTICATED_TOKEN_NO_ACCOUNTS",
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
          getAccounts: null,
        },
      },
    });
  });

  it.only("GetAccounts | Should give status ERROR_ACCOUNT_DOES_NOT_EXIST on bearer token", async () => {
    const result = await performTestQuery({
      query: getAccounts,
      variables: {},
      context: {
        smaug: { user: { id: "0102033691" } },
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN_NO_ACCOUNTS",
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

  // it("GetAccountsByLocalId | Should Retrieve accounts", async () => {
  //   const result = await performTestQuery({
  //     query: getAccountsByLocalId,
  //     variables: {
  //       input: {
  //         agencyId: "800001",
  //         localId: "C000000003",
  //       },
  //     },
  //     context: {
  //       smaug: { user: { id: "0102033690" } },
  //       datasources: createMockedDataLoaders(),
  //       accessToken: "AUTHENTICATED_TOKEN",
  //     },
  //   });

  //   expect(result).toEqual({
  //     data: {
  //       culr: {
  //         getAccountsByLocalId: {
  //           municipalityNo: null,
  //           guid: "4e6b3143-1df7-4db1-b8b4-f19d413437cb",
  //           accounts: [
  //             {
  //               agencyId: "800001",
  //               userIdType: "LOCAL",
  //               userIdValue: "C000000003",
  //             },
  //             {
  //               agencyId: "800002",
  //               userIdType: "LOCAL",
  //               userIdValue: "C000000004",
  //             },
  //           ],
  //         },
  //       },
  //     },
  //   });
  // });

  // it("DeleteAccount | Should give status ERROR_ACCOUNT_DOES_NOT_EXIST", async () => {
  //   const result = await performTestQuery({
  //     query: deleteAccount,
  //     variables: {
  //       input: {
  //         agencyId: "800001",
  //         localId: "C000000001",
  //       },
  //     },
  //     context: {
  //       smaug: { user: { id: "0102033690" } },
  //       datasources: createMockedDataLoaders(),
  //       accessToken: "AUTHENTICATED_TOKEN",
  //     },
  //   });

  //   expect(result).toEqual({
  //     data: {
  //       culr: {
  //         deleteAccount: {
  //           status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
  //         },
  //       },
  //     },
  //   });
  // });

  // it("DeleteAccount | Should give status OK", async () => {
  //   const result = await performTestQuery({
  //     query: deleteAccount,
  //     variables: {
  //       input: {
  //         agencyId: "800001",
  //         localId: "C000000002",
  //       },
  //     },
  //     context: {
  //       smaug: { user: { id: "0102033690" } },
  //       datasources: createMockedDataLoaders(),
  //       accessToken: "AUTHENTICATED_TOKEN",
  //     },
  //   });

  //   expect(result).toEqual({
  //     data: {
  //       culr: {
  //         deleteAccount: {
  //           status: "OK",
  //         },
  //       },
  //     },
  //   });
  // });
});
