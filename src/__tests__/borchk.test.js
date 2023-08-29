/**
 * @file This file tests the Borchk service responses
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

  const borchkStatus = `
    query Example_borchk($input: BorchkInput!) {
      borchk(input: $input) {
        status
      }
    } `;

  it("Borchk | Should give status LIBRARY_NOT_FOUND", async () => {
    const result = await performTestQuery({
      query: borchkStatus,
      variables: {
        input: {
          libraryCode: "000000",
          userId: "0123456789",
          userPincode: "1234",
        },
      },
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        borchk: {
          status: "LIBRARY_NOT_FOUND",
        },
      },
    });
  });

  it("Borchk | Should give status BORROWER_NOT_FOUND", async () => {
    const result = await performTestQuery({
      query: borchkStatus,
      variables: {
        input: {
          libraryCode: "710100",
          userId: "0123456789",
          userPincode: "0000",
        },
      },
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        borchk: {
          status: "BORROWER_NOT_FOUND",
        },
      },
    });
  });

  it("Borchk | Should give status OK", async () => {
    const result = await performTestQuery({
      query: borchkStatus,
      variables: {
        input: {
          libraryCode: "710100",
          userId: "0123456789",
          userPincode: "1234",
        },
      },
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "AUTHENTICATED_TOKEN",
      },
    });

    expect(result).toEqual({
      data: {
        borchk: {
          status: "OK",
        },
      },
    });
  });
});
