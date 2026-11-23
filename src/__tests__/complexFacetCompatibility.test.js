import { performTestQuery } from "../utils/utils";
import { load as facets } from "../datasources/complexSearch/complexFacetsWithLimit.datasource";
import { load as variants } from "../datasources/complexSearch/complexFacets.datasource";
import { load as indexes } from "../datasources/complexSearch/complexIndexes.datasource";
import { resolveFacetAliases } from "../datasources/complexSearch/facetAliases";

const query = `{
  complexSearch(cql: "harry", facets: {
    facets: [GENREFORM, GENREANDFORM, AUDIENCEGENERAL, GENERALAUDIENCE, LANGUAGE]
    facetLimit: 5
  }) { facets { name values { key score } } }
  complexFacets(cql: "harry", facets: {
    facets: [GENREFORM, GENREANDFORM, AUDIENCEGENERAL, GENERALAUDIENCE, LANGUAGE]
    facetLimit: 5
  }) { facets { name values { key score } } }
}`;
const names = [
  "facet.genreform",
  "facet.genreandform",
  "facet.audiencegeneral",
  "facet.generalaudience",
  "facet.language",
];

test.each(["legacy", "modern", "mixed", "aliases"])(
  "GraphQL facet aliases work through both endpoints with %s capabilities",
  async (mode) => {
    const fetch = jest.fn(async (url, options) => {
      if (url.endsWith("/indexes/json")) {
        return {
          ok: true,
          body: [
            [names[0], names[1]],
            [names[2], names[3]],
          ].map(([modern, legacy], i) => ({
            name:
              mode === "modern" || (mode === "mixed" && i === 0)
                ? modern
                : legacy,
            metaInfo: {
              facetIndex: true,
              aliases: mode === "aliases" ? [modern] : [],
            },
          })),
        };
      }
      const requested = JSON.parse(options.body).facets;
      expect(requested).toEqual([
        mode === "legacy" ? names[1] : names[0],
        mode === "modern" || mode === "aliases" ? names[2] : names[3],
        names[4],
      ]);
      return {
        ok: true,
        body: {
          facets: requested
            .map((name) => ({
              name:
                mode === "aliases"
                  ? name
                      .replace("genreform", "genreandform")
                      .replace("audiencegeneral", "generalaudience")
                  : name,
              values: name.includes("genre")
                ? [{ key: "fantasy", score: 7 }]
                : name === names[4]
                  ? [{ key: "dansk", score: 4 }]
                  : [],
            }))
            .reverse(),
        },
      };
    });
    const loaders = {
      complexFacetsWithLimit: facets,
      complexFacets: variants,
      complexIndexes: indexes,
    };
    const context = {
      fetch,
      getLoader: (name) => ({ load: (args) => loaders[name](args, context) }),
    };
    const result = await performTestQuery({
      query,
      context: {
        profile: { agency: "190101", name: "bibdk21" },
        datasources: context,
      },
    });
    expect(result.errors).toBeUndefined();
    const expected = names.map((name) => ({
      name,
      values: name.includes("genre")
        ? [{ key: "fantasy", score: 7 }]
        : name === names[4]
          ? [{ key: "dansk", score: 4 }]
          : [],
    }));
    expect(result.data.complexSearch.facets).toEqual(expected);
    expect(result.data.complexFacets.facets).toEqual(expected);
    const indexUrls = fetch.mock.calls
      .filter(([url]) => url.endsWith("/indexes/json"))
      .map(([url]) => url);
    const facetUrls = fetch.mock.calls
      .filter(([url]) => !url.endsWith("/indexes/json"))
      .map(([url]) => url);
    expect(indexUrls).toEqual(
      facetUrls.map((url) =>
        url.replace(/\/(facets|variants)$/, "/indexes/json")
      )
    );
  }
);

test("capabilities follow each destination and upgrade when its index list changes", async () => {
  const supported = new Map([
    ["http://search/api/v1", "facet.genreandform"],
    ["http://variants/api/v1", "facet.genreform"],
  ]);
  const load = jest.fn(async ({ url }) => [
    { index: supported.get(url), facet: true },
  ]);
  const context = { getLoader: () => ({ load }) };
  const requested = ["facet.genreform", "facet.genreandform"];
  const old = await resolveFacetAliases(
    requested,
    "http://search/api/v1/facets",
    context
  );
  const modern = await resolveFacetAliases(
    requested,
    "http://variants/api/v1/variants",
    context
  );
  expect(old.facets).toEqual(["facet.genreandform"]);
  expect(modern.facets).toEqual(["facet.genreform"]);
  supported.set("http://search/api/v1", "facet.genreform");
  const upgraded = await resolveFacetAliases(
    requested,
    "http://search/api/v1/facets",
    context
  );
  expect(upgraded.facets).toEqual(["facet.genreform"]);
  expect(
    upgraded.restore([
      { name: "facet.genreandform", values: [{ key: "stale", score: 99 }] },
      { name: "facet.genreform", values: [] },
    ])
  ).toEqual(requested.map((name) => ({ name, values: [] })));
});

test("unrelated facets need no capability lookup and preserve empty responses", async () => {
  const aliases = await resolveFacetAliases(
    ["facet.language"],
    "http://search/api/v1/facets",
    {}
  );
  expect(aliases.facets).toEqual(["facet.language"]);
  expect(aliases.restore()).toEqual([]);
});
