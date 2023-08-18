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

  it.only("Should give status ERROR_INVALID_CPR", async () => {
    const query = `
    mutation Example_CreateAccount($input: CreateAccountInput!) {
        culr {
            createAccount(input: $input, dryRun: true) {
                status
            }
        }
    }
    `;

    const result = await performTestQuery({
      query,
      variables: {
        input: {
          agencyId: "800010",
          localId: "C012345678",
          cpr: "0123456789",
        },
      },
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "DUMMY_TOKEN",
      },
    });

    console.error("ffffffff", result);

    expect(result).toMatchSnapshot();
  });
});
