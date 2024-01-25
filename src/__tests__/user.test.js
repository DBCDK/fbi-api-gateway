import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

const DEFAULT_USER = {
  userId: "some-id",
  uniqueId: "some-unique-id",
  municipalityAgencyId: "715100",
  loggedInAgencyId: "715100",
  agencies: [
    {
      agencyId: "715100",
      userId: "some@mail.com",
      userIdType: "LOCAL",
    },
    {
      agencyId: "715100",
      userId: "0102033690",
      userIdType: "CPR",
    },
  ],
};

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
      user: { ...DEFAULT_USER },
      smaug: {},
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - Backfill missing user data (from users other UserStatus accounts)", async () => {
  const result = await performTestQuery({
    query: `
            query {
              user {
                name
                mail
                address
                postalCode
                country
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        ...DEFAULT_USER,
        userId: "some-insufficient-userstatus-id-1",
        agencies: [
          DEFAULT_USER.agencies[1],
          {
            agencyId: "800010",
            userId: "some-insufficient-userstatus-id-3",
            userIdType: "LOCAL",
          },
          {
            agencyId: "790900",
            userId: "some-insufficient-userstatus-id-2",
            userIdType: "CPR",
          },
        ],
      },
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
      user: { ...DEFAULT_USER },
      smaug: {},
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
      user: { ...DEFAULT_USER },
      smaug: {},
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
      user: { ...DEFAULT_USER },
      smaug: {},
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
      user: { ...DEFAULT_USER },
      smaug: {},
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
      user: { ...DEFAULT_USER },
      smaug: {},
    },
  });
  expect(result).toMatchSnapshot();
});

test("user - Get agency specific user details", async () => {
  const result = await performTestQuery({
    query: `
            query  {
              user {
                name
                mail
                address
                postalCode
                country
                agencies {
                  id
                  name
                  type
                  url
                  user {
                    name
                    mail
                    address
                    postalCode
                    country
                    blocked
                  }
                  numberOfBranches
                }
              }
            }
        `,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: { ...DEFAULT_USER },
      smaug: {},
    },
  });
  expect(result).toMatchSnapshot();
});
