/**
 * @file This file contains tests for submitOrder
 *
 */

import { graphql } from "graphql";
import { internalSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

test("submitorder fails when user is not authenticated, and no userId provided", async () => {
  const result = await performTestQuery({
    query: `
          mutation{
            submitOrder(
              input: {
                pids: ["870970-basis:25574486"],
                pickUpBranch: "715100",
                userParameters: {
                  userAddress: "test",
                  userName: "Test Testesen",
                  userMail: "test@test.dk"
                }
              }) {
              status
              orsId
            }
          }`,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "some-access-token",
      smaug: { user: {}, app: { id: "app-name", ips: ["1.1.1.1"] } },
    },
  });
  expect(result).toMatchSnapshot();
});

test("submitorder succedes when user is authenticated, and no userId provided", async () => {
  const result = await performTestQuery({
    query: `
          mutation{
            submitOrder(
              input: {
                pids: ["870970-basis:25574486"],
                pickUpBranch: "715100",
                userParameters: {
                  userAddress: "test",
                  userName: "Test Testesen",
                  userMail: "test@test.dk"
                }
              }) {
              status
              orderId
            }
          }`,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "some-access-token",
      smaug: {
        user: { id: "123", agency: "715100" },
        app: { id: "app-name", ips: ["1.1.1.1"] },
      },
    },
  });
  expect(result).toMatchSnapshot();
});

test("submitorder succedes when user is not authenticated, but userId provided", async () => {
  const result = await performTestQuery({
    query: `
          mutation{
            submitOrder(
              input: {
                pids: ["870970-basis:25574486"],
                pickUpBranch: "715100",
                userParameters: {
                  userId: "123",
                  userAddress: "test",
                  userName: "Test Testesen",
                  userMail: "test@test.dk"
                }
              }) {
              status
              orderId
            }
          }`,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "some-access-token",
      smaug: { user: {}, app: { id: "app-name", ips: ["1.1.1.1"] } },
    },
  });
  expect(result).toMatchSnapshot();
});
