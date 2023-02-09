import { performTestQuery } from "../utils/utils";
import { createMockedDataLoaders } from "../datasourceLoader";

const query = `
query DidYouMean($q: SearchQuery!, $limit: Int) {
    search(q: $q) {
      didYouMean(limit: $limit) {
        query
        score
      }
    }
  }   
`;

test("Get 3 results from did you mean service", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      q: {
        all: "Anders Mathesen",
      },
      limit: 3,
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });

  expect(result).toMatchSnapshot();
});
