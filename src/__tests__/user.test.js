import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("user - get basic data", async () => {
  const result = await performTestQuery({
    query: `
            query {
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
                  result {
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
                  result {
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
