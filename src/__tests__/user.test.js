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
                municipalityAgencyId
                country
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {},
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
                agencies(language: da) {
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
      smaug: { user: { id: "some-id", uniqueId: "some-unique-id" } },
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
                agencies(language: en) {
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
      smaug: { user: { id: "some-id", uniqueId: "some-unique-id" } },
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
                  pickUpBranch {
                    agencyName
                  }
                  pickUpExpiryDate
                  holdQueuePosition
                  creator
                  orderType
                  orderDate
                  title
                  pages
                  edition
                  agencyId

                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: { user: { id: "some-id", uniqueId: "some-unique-id" } },
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
      smaug: { user: { id: "some-id", uniqueId: "some-unique-id" } },
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
                  materialType
                  loanId
                  dueDate
                  edition
                  pages
                  publisher
                  agencyId
                  manifestation {
                    pid
                    titles {
                      main
                    }
                    ownerWork {
                      workId
                    }
                    materialTypes {
                      specific
                    }
                    cover {
                      thumbnail
                    }
                    recordCreationDate
                  }
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: { user: { id: "some-id", uniqueId: "some-unique-id" } },
      homeAccount: {
        agencyId: "715100",
        userId: "some@mail.com",
        userIdType: "LOCAL",
      },
    },
  });
  expect(result).toMatchSnapshot();
});
