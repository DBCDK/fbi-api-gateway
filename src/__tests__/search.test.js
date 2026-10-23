/**
 * @file This file contains tests for the search operation
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";
import { load as search } from "../datasources/simplesearch.datasource";
import { load as facets } from "../datasources/facets.datasource";
import { load as intelligentFacets } from "../datasources/intelligentFacets.datasource";

test("search - with all filters and facets", async () => {
  const result = await performTestQuery({
    query: `
      {
        search(q:{all:"harry"})  {
          hitcount       
          works(offset: 0, limit: 10) {
            workId
          }   
          facets(facets: [MAINLANGUAGES, MATERIALTYPESSPECIFIC]) {
            name
            values(limit: 5) {
              term
              score
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

test("search forwards includeOnlineMaterials to search and both facet endpoints", async () => {
  for (const argument of [
    "",
    ", includeOnlineMaterials: true",
    ", includeOnlineMaterials: false",
  ]) {
    const fetch = jest.fn().mockResolvedValue({
      status: 200,
      body: { hits: 0, result: [], facets: { mainLanguages: {} } },
    });
    const loaders = { simplesearch: search, facets, intelligentFacets };
    const result = await performTestQuery({
      query: `{
        search(q: {all: "harry"}${argument}) {
          hitcount
          facets(facets: [MAINLANGUAGES]) { name }
          intelligentFacets { name }
        }
      }`,
      context: {
        datasources: {
          getLoader: (name) => ({
            load: (input) => loaders[name](input, { fetch }),
          }),
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(3);
    for (const [, options] of fetch.mock.calls) {
      expect(JSON.parse(options.body).includeOnlineMaterials).toBe(
        !argument.includes("false")
      );
    }
  }
});

test("search rejects explicit null for includeOnlineMaterials", async () => {
  const result = await performTestQuery({
    query: `{
      search(q: {all: "harry"}, includeOnlineMaterials: null) { hitcount }
    }`,
    context: { datasources: createMockedDataLoaders() },
  });

  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].message).toContain('Expected value of type "Boolean!"');
});
