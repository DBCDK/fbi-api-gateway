/**
 * @file This file contains tests for submitMutliOrder
 *
 */

import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";
import { getAvailablePids } from "../schema/order";

const userParameters = {
  userName: "Test Testesen",
  userMail: "test@dbc.dk",
};

const query = `
          mutation Example_SubmitMultipleOrders($input: SubmitMultipleOrdersInput!) {
            submitMultipleOrders(input: $input, dryRun: false) {
              failedAtCreation
              successfullyCreated
              status
              ok
            }
          }`;

const context = {
  datasources: createMockedDataLoaders(),
  accessToken: "DUMMY_TOKEN",
  user: {
    userId: "some-id",
    loggedInAgencyId: "715100",
    municipalityAgencyId: "100200", //TODO test users dont have digital article service, so its always a physical order
  },
  smaug: {
    app: { id: "app-name", ips: ["1.1.1.1"] },
    orderSystem: "bibliotekdk_21",
  },
};

const contextNotSubscriberOfDigitalArticleService = {
  ...context,
  user: {
    userId: "some-id",
    loggedInAgencyId: "715100",
    municipalityAgencyId: "911116", //911116 is not subscriber of digital article service as per 8. dec. 2023
  },
};
const contextNoAccountAtMunicipality = {
  ...context,
  user: {
    userId: "some-id",
    loggedInAgencyId: "715100",
    municipalityAgencyId: "734000", // DUMMY_TOKEN is not user at 734000
  },
};

const book = {
  pids: ["870970-basis:62795522", "870970-basis:39074184"],
  key: "work-of:870970-basis:39074184Bog",
};

const book2 = {
  pids: ["870970-basis:134976977", "870970-basis:62371455"],
  key: "work-of:870970-basis:62371455Bog",
};

const invalidOrder = {
  pids: [],
  key: "work-of:idontexistBog",
};

const digitalArticle = {
  pids: ["870970-basis:04978617"],
  key: "work-of:870970-basis:04978617Tidsskrift",
  periodicaForm: {
    publicationDateOfComponent: "2023",
    titleOfComponent: "Some exciting article",
    pid: "870970-basis:04978617",
  },
};

const physicalPeriodica = {
  pids: ["870970-basis:04978617"],
  key: "work-of:870970-basis:04978617Tidsskrift",
  periodicaForm: {
    publicationDateOfComponent: "2023",
    pid: "870970-basis:04978617",
  },
};

describe("submitMultipleOrders", () => {
  test("succeeds: user orders multiple books ", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, book2],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context,
    });
    expect(result).toMatchSnapshot();
  });

  test("succeeds: user orders multiple books and digital article", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, book2, digitalArticle],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context,
    });
    expect(result).toMatchSnapshot();
  });

  test("succeeds: user orders a book, a digital article and a physical periodica", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, digitalArticle, physicalPeriodica],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context,
    });
    expect(result).toMatchSnapshot();
  });

  test("succeeds: digital article becomes physical order, if users homeagency not subscriber of digital article service", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, digitalArticle],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context: contextNotSubscriberOfDigitalArticleService,
    });
    expect(result).toMatchSnapshot();
  });

  test("succeeds: digital article becomes physical order, if user doesnt have account at homeagency", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, digitalArticle],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context: contextNoAccountAtMunicipality,
    });
    expect(result).toMatchSnapshot();
  });

  test("all orders fail: unknown pickupBranch", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, digitalArticle],
          pickUpBranch: "123", //submitOrder fails with UNKNOWN_PICKUPAGENCY
          userParameters,
        },
      },
      context,
    });
    expect(result).toMatchSnapshot();
  });

  test("1 succeeds 1 fails", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, invalidOrder],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context,
    });
    expect(result).toMatchSnapshot();
  });

  test("2 succeed, we order physical periodica when no title, author or pagenumber is given", async () => {
    const result = await performTestQuery({
      query,
      variables: {
        input: {
          materialsToOrder: [book, physicalPeriodica],
          pickUpBranch: "715100",
          userParameters,
        },
      },
      context,
    });
    expect(result).toMatchSnapshot();
  });

  test("getAvailablePids filters PIDs based on availability", async () => {
    // Mock the holdingsGetAllAvailability datasource
    const mockHoldingsLoader = {
      load: jest.fn().mockImplementation(({ pid }) => {
        // Mock that some PIDs are not available (librariesLend = 0)
        const availabilityMap = {
          "870970-basis:62795522": { librariesLend: 2 }, // Available
          "870970-basis:39074184": { librariesLend: 0 }, // Not available
          "870970-basis:134976977": { librariesLend: 1 }, // Available
          "870970-basis:62371455": { librariesLend: 0 }, // Not available
        };
        return Promise.resolve(availabilityMap[pid] || { librariesLend: 0 });
      }),
    };

    const testContext = {
      datasources: {
        getLoader: jest.fn().mockReturnValue(mockHoldingsLoader),
      },
      smaug: {
        gateway: {
          localizationsRole: "test-role",
        },
      },
    };

    const pids = [
      "870970-basis:62795522",
      "870970-basis:39074184",
      "870970-basis:134976977",
      "870970-basis:62371455",
    ];
    const result = await getAvailablePids(pids, testContext);

    // Should return only available PIDs
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("870970-basis:62795522");
    expect(result[1]).toBe("870970-basis:134976977");

    // Verify that holdingsGetAllAvailability was called for each PID
    expect(mockHoldingsLoader.load).toHaveBeenCalledTimes(4);
    expect(mockHoldingsLoader.load).toHaveBeenCalledWith({
      pid: "870970-basis:62795522",
      role: "test-role",
    });
    expect(mockHoldingsLoader.load).toHaveBeenCalledWith({
      pid: "870970-basis:39074184",
      role: "test-role",
    });
    expect(mockHoldingsLoader.load).toHaveBeenCalledWith({
      pid: "870970-basis:134976977",
      role: "test-role",
    });
    expect(mockHoldingsLoader.load).toHaveBeenCalledWith({
      pid: "870970-basis:62371455",
      role: "test-role",
    });
  });
});
