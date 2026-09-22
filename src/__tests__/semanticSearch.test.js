import config from "../config";
import { createMockedDataLoaders } from "../datasourceLoader";
import { load } from "../datasources/semanticsearch.datasource";
import { performTestQuery } from "../utils/utils";

describe("semanticSearch datasource", () => {
  test("maps the request and response without exposing debug", async () => {
    const context = {
      fetch: jest.fn().mockResolvedValue({
        body: {
          hit_count: 40,
          results: [
            { persistent_work_id: "work-2" },
            { persistent_work_id: "work-3" },
          ],
        },
      }),
    };

    await expect(
      load(
        {
          q: "sociale medier og unges trivsel",
          profile: { agency: "701010", name: "opac" },
          offset: 1,
          limit: 2,
          threshold: 0.25,
        },
        context
      )
    ).resolves.toEqual({
      result: [{ workid: "work-2" }, { workid: "work-3" }],
      hitcount: 40,
    });

    expect(context.fetch).toHaveBeenCalledWith(
      config.datasources.semanticsearch.url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_string: "sociale medier og unges trivsel",
          agency: "701010",
          profile: "opac",
          limit: 2,
          offset: 1,
          threshold: 0.25,
          debug: false,
        }),
      }
    );
  });
});

describe("semanticSearch query", () => {
  test("returns resolved works", async () => {
    const result = await performTestQuery({
      query: `
        {
          semanticSearch(q: "sociale medier", threshold: 0.2) {
            hitcount
            works(offset: 0, limit: 5) {
              workId
            }
          }
        }
      `,
      variables: {},
      context: { datasources: createMockedDataLoaders() },
    });

    expect(result).toEqual({
      data: {
        semanticSearch: {
          hitcount: 0,
          works: [{ workId: "work-of:870970-basis:53557791" }],
        },
      },
    });
  });

  test("rejects thresholds outside the range from 0 to 1", async () => {
    const result = await performTestQuery({
      query: `
        {
          semanticSearch(q: "sociale medier", threshold: 1.1) {
            works(offset: 0, limit: 5) {
              workId
            }
          }
        }
      `,
      variables: {},
      context: { datasources: createMockedDataLoaders() },
    });

    expect(result.data).toBeNull();
    expect(result.errors[0].message).toBe("Threshold must be between 0 and 1");
  });
});
