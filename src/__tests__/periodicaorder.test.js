import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

const query = `
mutation($input: PeriodicaArticleOrder!) {
  submitPeriodicaArticleOrder(input: $input) {
    status
  }
}    
`;
test("PeriodicaArticleOrder, unauthorized user should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: { pid: "870971-avis:34591016", pickUpBranch: "715100" },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, unknown pickupBranch should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
        pickUpBranch: "some-unknown-agency",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: { userId: "1234561234" },
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, agency not subscribed should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
        pickUpBranch: "100200",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: { userId: "1234561234", loggedInAgencyId: "100200" },
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, manifestation not part of statsbibliotek journal should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-anmeld:37860409",
        pickUpBranch: "715100",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: { userId: "1234561234", loggedInAgencyId: "715100" },
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, order success", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
        pickUpBranch: "715100",
        authorOfComponent: "some author",
        publicationDateOfComponent: "1972",
        volume: "8",
        titleOfComponent: "some-title",
        pagination: "100-145",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: { userId: "1234561234", loggedInAgencyId: "715100" },
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, order when agency has no borrowerCheck", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
        pickUpBranch: "820050",
        userName: "Test Testesen",
        userMail: "test@dbc.dk",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN_NOT_AUTHENTICATED",
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});
