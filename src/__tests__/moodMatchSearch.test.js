import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("moodMatchSearch", async () => {
  const result = await performTestQuery({
    query: `
        query ($q: String!, $limit: PaginationLimit!, $offset: Int!) {
        mood{
        moodSearch(q: $q) {
          works(offset: $offset, limit: $limit) {
            workId
            titles {
              main
            }
          }
        }
      }
      }
        `,
    variables: {
      q: "fisk",
      limit: 10,
      offset: 0,
    },
    context: {
      profile: { agency: "190101", name: "bibdk21" },
      smaug: {},
      user: { userId: "fisk", loggedInAgencyId: "190101" },
      accessToken: "DUMMY_TOKEN",
      datasources: createMockedDataLoaders(),
    },
  });

  expect(result).toMatchSnapshot();
});
