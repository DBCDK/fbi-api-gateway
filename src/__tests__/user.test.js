import mockedLibrary from "../datasources/mocked/library.datasource.mocked";
import mockedUser from "../datasources/mocked/user.datasource.mocked";

import { graphql } from "graphql";
import { internalSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

test("user - get basic data", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                name
                address
                postalCode
                mail
                culrMail
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - get agency danish", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                name
                address
                postalCode
                mail
                agency(language: da) {
                    branches {
                      openingHours
                      name
                    }
                  }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - get agency english", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                name
                address
                postalCode
                mail
                agency(language: en) {
                    branches {
                      openingHours
                      name
                    }
                  }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - get loans", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                loans {
                  loanId
                  dueDate   
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - get orders", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                orders {
                  orderId
                  status
                  pickUpExpiryDate
                  orderDate
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - get debt", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                debt {
                  amount
                  creator
                  currency
                  date
                  title
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });
  expect(result).toMatchSnapshot();
});
