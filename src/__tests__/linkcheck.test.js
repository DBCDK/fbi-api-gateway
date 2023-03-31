import { performTestQuery } from "../utils/utils";
import { createMockedDataLoaders } from "../datasourceLoader";

const query = `
query Example_LinkCheck($urls: [String!]) {
    linkCheck {
      checks(urls: $urls) {
        url
        status
        lastCheckedAt
        brokenSince
      }
    }
  }   
`;

test("Get 2 url check responses", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      urls: ["http://example.com/foo", "http://example.com"],
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
    },
  });

  expect(result).toMatchSnapshot();
});
