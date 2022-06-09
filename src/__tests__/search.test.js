/**
 * @file This file contains tests for the search operation
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("search - with all filters and facets", async () => {
  const result = await performTestQuery({
    query: `
      {
        search(q:{all:"harry"})  {
          hitcount       
          works(offset: 0, limit: 10) {
            workId
          }   
          facets(facets: [language, materialType]) {
            name
            values(limit: 5) {
              term
              count
            }
          }
        }
      }
        `,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
