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
      user: null,
      smaug: {
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
      accessToken: "DUMMY_TOKEN_BLOCKED",
      user: { userId: "some-blocked-id", loggedInAgencyId: "715100" },
      smaug: {
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
                pickUpBranch: "790900",
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
      user: {},
      smaug: {
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
      user: { userId: "some-id", loggedInAgencyId: "715100" },
      smaug: {
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
                  userId: "some-id",
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
      user: null,
      smaug: {
        app: { id: "app-name", ips: ["1.1.1.1"] },
        orderSystem: "bibliotekdk_21",
      },
    },
  });
  expect(result).toMatchSnapshot();
});
