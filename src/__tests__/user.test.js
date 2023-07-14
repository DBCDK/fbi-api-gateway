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
      smaug: { user: { uniqueId: "some-unique-id" } },
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
      smaug: { user: { uniqueId: "some-unique-id" } },
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
      smaug: { user: { uniqueId: "some-unique-id" } },
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
      smaug: { user: { uniqueId: "some-unique-id" } },
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
                  manifestation {
                    pid
                    titles {
                      main
                    }
                    ownerWork {
                      workId
                    }
                    creators {
                      ...creatorsFragment
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

            fragment creatorsFragment on Creator {
              ... on Corporation {
                __typename
                display
                nameSort
                roles {
                  function {
                    plural
                    singular
                  }
                  functionCode
                }
              }
              ... on Person {
                __typename
                display
                nameSort
                roles {
                  function {
                    plural
                    singular
                  }
                  functionCode
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: { user: { uniqueId: "some-unique-id" } },
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
      smaug: { user: { uniqueId: "some-unique-id" } },
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
                    creators {
                      ...creatorsFragment
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

            fragment creatorsFragment on Creator {
              ... on Corporation {
                __typename
                display
                nameSort
                roles {
                  function {
                    plural
                    singular
                  }
                  functionCode
                }
              }
              ... on Person {
                __typename
                display
                nameSort
                roles {
                  function {
                    plural
                    singular
                  }
                  functionCode
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: { user: { uniqueId: "some-unique-id" } },
    },
  });
  expect(result).toMatchSnapshot();
});
