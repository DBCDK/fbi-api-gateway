/**
 * @file This file contains tests for the inspiration operation
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("Inspiration - categories", async () => {
  const result = await performTestQuery({
    query: `
     {
        inspiration {
          categories {
            games {
              title
              works {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }`,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
