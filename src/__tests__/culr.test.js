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
    mutation Example_CreateAccount($input: CreateAccountInput!) {
        culr {
            createAccount(input: $input, dryRun: false) {
                status
            }
        }
    } `;

  const deleteAccount = `
    mutation Example_CreateAccount($input: DeleteAccountInput!) {
        culr {
            deleteAccount(input: $input, dryRun: false) {
                status
            }
        }
    } `;

  const getAccountsByLocalId = `
    mutation Example_CreateAccount($input: GetAccountsByLocalIdInput!) {
      culr {
        getAccountsByLocalId(input: $input) {
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

  it("CreateAccount | Should give status ERROR_INVALID_CPR", async () => {
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

  it("CreateAccount | Should give status ERROR_INVALID_AGENCY", async () => {
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

  it("CreateAccount | Should give status ERROR_USER_ALREADY_CREATED", async () => {
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

  it("CreateAccount | Should give status ERROR_AGENCYID_NOT_PERMITTED", async () => {
    const result = await performTestQuery({
      query: createAccount,
      variables: {
        input: {
          agencyId: "800000",
          localId: "C000000002",
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
            status: "ERROR_AGENCYID_NOT_PERMITTED",
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
          agencyId: "812345",
          localId: "C000000002",
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
            status: "OK",
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
          agencyId: "812345",
          localId: "C000000002",
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
            status: "OK",
          },
        },
      },
    });
  });

  it("GetAccountsByLocalId | Should give status ERROR_ACCOUNT_DOES_NOT_EXIST", async () => {
    const result = await performTestQuery({
      query: getAccountsByLocalId,
      variables: {
        input: {
          agencyId: "800002",
          localId: "C000000004",
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
          getAccountsByLocalId: null,
        },
      },
    });
  });

  it("GetAccountsByLocalId | Should Retrieve accounts", async () => {
    const result = await performTestQuery({
      query: getAccountsByLocalId,
      variables: {
        input: {
          agencyId: "800001",
          localId: "C000000003",
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
          getAccountsByLocalId: {
            municipalityNo: null,
            guid: "4e6b3143-1df7-4db1-b8b4-f19d413437cb",
            accounts: [
              {
                agencyId: "800001",
                userIdType: "LOCAL",
                userIdValue: "C000000003",
              },
              {
                agencyId: "800002",
                userIdType: "LOCAL",
                userIdValue: "C000000004",
              },
            ],
          },
        },
      },
    });
  });

  it("DeleteAccount | Should give status ERROR_ACCOUNT_DOES_NOT_EXIST", async () => {
    const result = await performTestQuery({
      query: deleteAccount,
      variables: {
        input: {
          agencyId: "800001",
          localId: "C000000001",
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
          deleteAccount: {
            status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
          },
        },
      },
    });
  });

  it("DeleteAccount | Should give status OK", async () => {
    const result = await performTestQuery({
      query: deleteAccount,
      variables: {
        input: {
          agencyId: "800001",
          localId: "C000000002",
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
          deleteAccount: {
            status: "OK",
          },
        },
      },
    });
  });
});
