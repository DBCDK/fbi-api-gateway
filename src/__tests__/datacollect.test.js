import { graphql } from "graphql";
import { getExecutableSchema } from "../schemaLoader";

let internalSchema;

export async function performTestQuery({ query, variables, context }) {
  return graphql(
    internalSchema,
    query,
    null,
    { ...context, profile: { agency: "123456", name: "some-profile" } },
    variables
  );
}

describe("API test cases", () => {
  let spy = {};

  beforeEach(async () => {
    if (!internalSchema) {
      internalSchema = await getExecutableSchema({
        loadExternal: false,
        clientPermissions: { admin: true },
      });
    }
    spy.console = jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    spy.console.mockClear();
  });

  afterAll(() => {
    spy.console.mockRestore();
  });

  test("Mutation succes: data collect with search_work", async () => {
    const result = await performTestQuery({
      query: `
          mutation ($input: DataCollectInput!) {
            data_collect(input: $input)
          }
        `,
      variables: {
        input: {
          search_work: {
            search_query_hit: 7,
            search_query_work: "some-work-id",
            search_request: { q: { all: "harry" } },
            session_id: "some-session-id",
          },
        },
      },
      context: {
        smaug: { app: { ips: ["some-ip"] } },
        tracking: { consent: true, uniqueVisitorId: "some-session-id" },
      },
    });
    expect(result).toEqual({
      data: {
        data_collect: "OK",
      },
    });
    // Check that entry is written to std out in th format AI expects
    expect(JSON.parse(spy.console.mock.calls[0][0])).toMatchObject({
      type: "data",
      message: JSON.stringify({
        ip: "some-ip",
        "search-query-hit": 7,
        "search-query-work": "some-work-id",
        "search-request": { q: { all: "harry" } },
        "session-id": "some-session-id",
        "user-id": null,
        "tracking-consent": true,
      }),
    });
  });
  test("Mutation error: data collect, multiple inputs not allowed", async () => {
    const result = await performTestQuery({
      query: `
          mutation ($input: DataCollectInput!) {
            data_collect(input: $input)
          }
        `,
      variables: {
        input: {
          search_work: {
            search_request: { q: { all: "harry" } },
            search_query_hit: 7,
            search_query_work: "some-work-id",
            session_id: "some-session-id",
          },
          example: { example: "some-string", session_id: "some-session-id" },
        },
      },
      context: {},
    });
    expect(result.errors[0].message).toEqual(
      "Exactly 1 input must be specified"
    );
  });
  test("Mutation error: data collect, no inputs not allowed", async () => {
    const result = await performTestQuery({
      query: `
          mutation ($input: DataCollectInput!) {
            data_collect(input: $input)
          }
        `,
      variables: {
        input: {},
      },
      context: {},
    });
    expect(result.errors[0].message).toEqual(
      "Exactly 1 input must be specified"
    );
  });
});
