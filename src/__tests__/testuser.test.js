import { createTestUserDataLoaders } from "../datasourceLoader";
import { parseTestToken } from "../utils/testUserStore";
import { performTestQuery } from "../utils/utils";

const redisObjects = {};
jest.mock("../datasources/redis.datasource", () => ({
  get: (key) => redisObjects[key],
  set: (key, _ttl, val) => (redisObjects[key] = { val }),
}));
const testToken = "test_nemlogin_kfu:d66828f989e1184g0d51g1dcdf9d9985ecdcb6ed";
const testUserQuery = `query TestUser {
  test {
    user {
      accounts {
        agency {
          agencyName
          agencyId
        }
        cpr
        debt
        uniqueId
        blocked
        isMunicipality
      }
    }
  }
}
`;

const testUserMutate = `mutation MutateTestUser($input: TestUserInput) {
  test {
    user(
      input: $input
    )
  }
}
`;

describe("Testuser", () => {
  test("parser can parse test token", async () => {
    expect(parseTestToken(testToken)).toMatchSnapshot();
  });
  test("test user can be fetched", async () => {
    const result = await performTestQuery({
      query: testUserQuery,
      variables: {},
      context: {
        ...parseTestToken(testToken),
        datasources: createTestUserDataLoaders(),
      },
    });
    expect(result).toMatchSnapshot();
  });
  test("test user is null without test token", async () => {
    const result = await performTestQuery({
      query: testUserQuery,
      variables: {},
      context: {
        accessToken: "d66828f989e118430d5151dcdf9d9985ecdcb6ed",
        datasources: createTestUserDataLoaders(),
      },
    });
    expect(result).toMatchSnapshot();
  });
  test("can store test user", async () => {
    await performTestQuery({
      query: testUserMutate,
      variables: {
        input: {
          accounts: [
            {
              isMunicipality: true,
              agency: "716300",
              debt: "100",
              cpr: "0101011234",
            },
            { agency: "715100" },
          ],
        },
      },
      context: {
        ...parseTestToken(testToken),
        datasources: createTestUserDataLoaders(),
      },
    });

    const result = await performTestQuery({
      query: testUserQuery,
      variables: {},
      context: {
        ...parseTestToken(testToken),
        datasources: createTestUserDataLoaders(),
      },
    });
    expect(result).toMatchSnapshot();
  });

  test("Error when storing test user without test token", async () => {
    const result = await performTestQuery({
      query: testUserMutate,
      variables: {
        input: {
          accounts: [
            {
              agency: "716300",
            },
            { agency: "715100" },
          ],
        },
      },
      context: {
        accessToken: "d66828f989e118430d5151dcdf9d9985ecdcb6ed",
        datasources: createTestUserDataLoaders(),
      },
    });
    expect(result).toMatchSnapshot();
  });
});
