/**
 * @file This file contains tests for submitOrder
 *
 */

import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

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
      accessToken: "ANONYMOUS_TOKEN",
      smaug: {
        user: {},
        app: { id: "app-name", ips: ["1.1.1.1"] },
        orderSystem: "bibliotekdk_21",
      },
    },
  });
  expect(result).toMatchSnapshot();
});

test("submitorder failed when user is blocked by pickupBranch (Agency)", async () => {
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
      accessToken: "DUMMY_TOKEN",
      smaug: {
        user: { id: "0123456799", agency: "715100" },
        app: { id: "app-name", ips: ["1.1.1.1"] },
        orderSystem: "bibliotekdk_21",
      },
    },
  });
  expect(result).toMatchSnapshot();
});

test("submitorder failed when user is not found on pickupbranch (borchk)", async () => {
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
      accessToken: "DUMMY_TOKEN_USER_NOT_ON_PICKUPAGENCY",
      smaug: {
        user: { id: "321", agency: "710100" },
        app: { id: "app-name", ips: ["1.1.1.1"] },
        orderSystem: "bibliotekdk_21",
      },
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
      accessToken: "DUMMY_TOKEN",
      smaug: {
        user: { id: "123", agency: "715100" },
        app: { id: "app-name", ips: ["1.1.1.1"] },
        orderSystem: "bibliotekdk_21",
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
      accessToken: "ANONYMOUS_TOKEN",
      smaug: {
        user: {},
        app: { id: "app-name", ips: ["1.1.1.1"] },
        orderSystem: "bibliotekdk_21",
      },
    },
  });
  expect(result).toMatchSnapshot();
});
