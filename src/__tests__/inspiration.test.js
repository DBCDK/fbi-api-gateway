/**
 * @file This file contains tests for the inspiration operation
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("Inspiration - categories with work", async () => {
  const result = await performTestQuery({
    query: `
     {
        inspiration {
          categories {
            games {
              title
              result {
                work {
                  workId
                  titles {
                    main
                  }
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

test("Inspiration - categories with manifestations", async () => {
  const result = await performTestQuery({
    query: `
     {
        inspiration {
          categories {
            games {
              title
              result {
                manifestation {
                  pid
                  titles {
                    main
                  }
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
