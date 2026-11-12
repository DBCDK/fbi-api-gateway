import { performTestQuery } from "../utils/utils";
import { mapFilters } from "../utils/filtersAndFacetsMap";

const oldHost = "http://simple-search-fbiapi-1-9.ai-prod.svc.cloud.dbc.dk";
const newHost =
  "http://simple-search-fbiapi-datawell-staging-1-10.ai-staging.svc.cloud.dbc.dk";
const families = [
  {
    old: "genreAndForm",
    modern: "genreForm",
    argument: "genreFacet",
    value: "fantasy",
  },
  {
    old: "generalAudience",
    modern: "audienceGeneral",
    argument: "audienceFacet",
    value: "for højtlæsning",
  },
];
const facet = (name, values = []) => ({
  name,
  type: name.toUpperCase(),
  values,
});

function setup(searchHost, facetHost, data) {
  const searchUrl = `${searchHost}/search`;
  const facetsUrl = `${facetHost}/facets`;
  let loaders;
  // Datasources capture their configured URLs at import, like a real deployment.
  jest.isolateModules(() => {
    const config = require("../config").default;
    config.datasources.simplesearch.url = searchUrl;
    config.datasources.facets.url = facetsUrl;
    loaders = {
      simplesearch: require("../datasources/simplesearch.datasource").load,
      facets: require("../datasources/facets.datasource").load,
      intelligentFacets: require("../datasources/intelligentFacets.datasource")
        .load,
    };
  });
  const fetch = jest.fn(async (url, options) => ({
    status: 200,
    body:
      url === searchUrl
        ? { hits: 3, result: [] }
        : JSON.parse(options.body)["facets.intelligent_facet"]
          ? {
              facets: Object.entries(data).map(([name, terms]) => ({
                name,
                values: Object.entries(terms).map(([term, count]) => ({
                  term,
                  count,
                })),
              })),
            }
          : { facets: data },
  }));
  return {
    fetch,
    context: {
      datasources: {
        getLoader: (name) => ({
          load: (input) => loaders[name](input, { fetch }),
        }),
      },
    },
  };
}

describe.each(families)("$modern compatibility", (family) => {
  const { old, modern, argument, value } = family;
  const query = `query Compatibility($filters: SearchFiltersInput) {
    search(q: {all: "harry"}, filters: $filters) {
      hitcount
      facets(facets: [${old.toUpperCase()}, ${modern.toUpperCase()}]) {
        name type values(limit: 5) { key score }
      }
      legacy: intelligentFacets { name type values(limit: 5) { key score } }
      modern: intelligentFacets(${argument}: ${modern.toUpperCase()}) { name type values(limit: 5) { key score } }
    }
  }`;
  const values = [{ key: value, score: 3 }];

  test.each([
    [oldHost, oldHost],
    [newHost, newHost],
    [oldHost, newHost],
    [newHost, oldHost],
  ])(
    "maps each request using its destination: search %s, facets %s",
    async (searchHost, facetHost) => {
      const responseField = facetHost === newHost ? modern : old;
      for (const publicField of [old, modern]) {
        const { context, fetch } = setup(searchHost, facetHost, {
          [responseField]: { [value]: 3 },
        });
        const result = await performTestQuery({
          query,
          variables: { filters: { [publicField]: [value] } },
          context,
        });
        expect(result.errors).toBeUndefined();
        expect(result.data.search).toEqual({
          hitcount: 3,
          facets: [facet(old, values), facet(modern, values)],
          legacy: [facet(old, values)],
          modern: [facet(modern, values)],
        });
        expect(fetch).toHaveBeenCalledTimes(4);
        for (const [url, options] of fetch.mock.calls) {
          const body = JSON.parse(options.body);
          const name = url.startsWith(newHost) ? modern : old;
          expect(body.filters).toEqual({ [name]: [value] });
          if (body.facets) expect(body.facets).toEqual([name]);
        }
      }
    }
  );

  test.each([["value"], ["empty"], ["null"]])(
    "new alias precedence: %s",
    async (mode) => {
      const input = mode === "empty" ? [] : mode === "null" ? null : [value];
      const expected = input ?? ["legacy"];
      const { context, fetch } = setup(newHost, newHost, {
        [modern]: { [value]: 3 },
      });
      const result = await performTestQuery({
        query,
        variables: { filters: { [old]: ["legacy"], [modern]: input } },
        context,
      });
      expect(result.errors).toBeUndefined();
      for (const [, options] of fetch.mock.calls) {
        expect(JSON.parse(options.body).filters).toEqual({
          [modern]: expected,
        });
      }
    }
  );

  test("selected filters survive a failed facet request", async () => {
    const { context, fetch } = setup(newHost, newHost, {});
    fetch.mockResolvedValue({ status: 500, body: {} });
    const result = await performTestQuery({
      query: `{
        search(q: {all: "harry"}, filters: {${old}: ["${value}"]}) {
          facets(facets: [${old.toUpperCase()}, ${modern.toUpperCase()}]) {
            name type values(limit: 5) { key score }
          }
        }
      }`,
      context,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data.search.facets).toEqual([
      facet(old, [{ key: value, score: 0 }]),
      facet(modern, [{ key: value, score: 0 }]),
    ]);
  });

  test("empty new responses win over legacy values and intelligent facets are deduplicated", async () => {
    const { context } = setup(newHost, newHost, {
      [old]: { legacy: 99 },
      [modern]: {},
    });
    const result = await performTestQuery({ query, context });
    expect(result.errors).toBeUndefined();
    expect(result.data.search).toEqual({
      hitcount: 3,
      facets: [facet(old), facet(modern)],
      legacy: [facet(old)],
      modern: [facet(modern)],
    });
  });
});

test("genre and audience names are independent and other facets are preserved", async () => {
  const { context, fetch } = setup(oldHost, newHost, {
    genreAndForm: { legacy: 99 },
    genreForm: { fantasy: 2 },
    mainLanguages: { dan: 7 },
    generalAudience: { legacy: 99 },
    audienceGeneral: { voksne: 3 },
  });
  const result = await performTestQuery({
    query: `{
      search(q: {all: "harry"}, filters: {generalAudience: ["voksne"], genreForm: ["fantasy"]}) {
        legacy: intelligentFacets { name type values(limit: 5) { key score } }
        audienceOnly: intelligentFacets(audienceFacet: AUDIENCEGENERAL) { name type }
        modern: intelligentFacets(audienceFacet: AUDIENCEGENERAL, genreFacet: GENREFORM) { name type }
      }
    }`,
    context,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data.search.legacy).toEqual([
    facet("genreAndForm", [{ key: "fantasy", score: 2 }]),
    facet("mainLanguages", [{ key: "dan", score: 7 }]),
    facet("generalAudience", [{ key: "voksne", score: 3 }]),
  ]);
  expect(result.data.search.audienceOnly).toEqual([
    { name: "genreAndForm", type: "GENREANDFORM" },
    { name: "mainLanguages", type: "MAINLANGUAGES" },
    { name: "audienceGeneral", type: "AUDIENCEGENERAL" },
  ]);
  expect(result.data.search.modern).toEqual([
    { name: "genreForm", type: "GENREFORM" },
    { name: "mainLanguages", type: "MAINLANGUAGES" },
    { name: "audienceGeneral", type: "AUDIENCEGENERAL" },
  ]);
  for (const [, options] of fetch.mock.calls) {
    expect(JSON.parse(options.body).filters).toEqual({
      genreForm: ["fantasy"],
      audienceGeneral: ["voksne"],
    });
  }
});

test.each([
  [oldHost, false],
  [newHost, true],
  ["http://simple-search-fbiapi-1-11.ai-prod.svc.cloud.dbc.dk/search", true],
  [
    "http://simple-search-fbiapi-datawell-prod-2-0.ai-prod.svc.cloud.dbc.dk/facets",
    true,
  ],
  ["http://localhost:8080/search", false],
  ["http://proxy.example/simple-search-fbiapi-1-10/search", false],
])("selects numeric versions from the hostname only: %s", (url, modern) => {
  expect(
    mapFilters(
      {
        genreForm: ["fantasy"],
        generalAudience: ["voksne"],
        ageRange: ["8-12"],
      },
      url
    )
  ).toEqual({
    [modern ? "genreForm" : "genreAndForm"]: ["fantasy"],
    [modern ? "audienceGeneral" : "generalAudience"]: ["voksne"],
    age_range: ["8-12"],
  });
});
