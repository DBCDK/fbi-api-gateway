/**
 * @file This file contains tests for the search operation
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("search - with all filters and facets", async () => {
  const result = await performTestQuery({
    query: `
      {
        search(q: {all: "*", title: "*", creator: "*", subject: "*"},filters: {accessType: [], audience: [], creator: [], fictionNonfiction: [], fictiveCharacter: [], genre: [], language: [], materialType: [], subject: [], workType: []}) {
          hitcount
          works(offset: 0, limit: 10) {
            id
          }
          facets(facets: [workType, language, materialType, fictiveCharacter, genre, audience, accessType, fictionNonfiction, subject, creator]) {
            name
            values(limit: 1) {
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
