import { graphql } from "graphql";
import { internalSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

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
      smaug: { user: { id: "1234561234" } },
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
      smaug: { user: { id: "1234561234", agency: "100200" } },
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
      smaug: { user: { id: "1234561234", agency: "715100" } },
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
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: { user: { id: "1234561234", agency: "715100" } },
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
