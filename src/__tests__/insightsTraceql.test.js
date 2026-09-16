import { buildSchema } from "graphql";
import config from "../config";
import { resolvers } from "../schema/insights";

describe("TraceQL Insights resolvers", () => {
  const originalEnabled = config.datasources.traceql.insightsEnabled;

  afterEach(() => {
    config.datasources.traceql.insightsEnabled = originalEnabled;
  });

  test("maps every paginated TraceQL field result", async () => {
    config.datasources.traceql.insightsEnabled = true;
    const load = jest
      .fn()
      .mockResolvedValueOnce({
        fields: [
          {
            field: "Work.title",
            requestCount: 12,
            clientCount: 2,
            operationCount: 3,
          },
        ],
        nextCursor: "next-page",
      })
      .mockResolvedValueOnce({
        fields: [{ field: "Query.works", requestCount: 7 }],
        nextCursor: null,
      });
    const context = {
      datasources: {
        getLoader: jest.fn(() => ({ load })),
      },
    };
    const schema = buildSchema(`
      type Query { works: [Work!]! }
      type Work { title: String! }
    `);
    const parent = await resolvers.Query.insights(null, { days: 3 }, context, {
      schema,
    });

    const fields = await resolvers.Insight.fields(parent, {}, context, {
      schema,
    });

    expect(fields).toEqual([
      expect.objectContaining({
        type: "Work",
        field: "title",
        kind: "String",
        count: 12,
      }),
      expect.objectContaining({
        type: "Query",
        field: "works",
        kind: "Work",
        count: 7,
      }),
    ]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.calls[0][0].params.from).toBe(parent.start);
    expect(load.mock.calls[0][0].params).not.toHaveProperty("to");
    expect(load.mock.calls[1][0].params.cursor).toBe("next-page");
    expect(load.mock.calls[1][0].params).not.toHaveProperty("to");
  });

  test("forwards dimension filters and maps arguments and input fields", async () => {
    config.datasources.traceql.insightsEnabled = true;
    const load = jest
      .fn()
      .mockResolvedValueOnce({
        arguments: [
          {
            argument: "Query.search.q",
            requestCount: 8,
            clientCount: 2,
          },
        ],
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        inputFields: [
          {
            inputField: "SearchInput.filters",
            requestCount: 5,
            clientCount: 1,
          },
        ],
        nextCursor: null,
      });
    const context = {
      datasources: {
        getLoader: jest.fn(() => ({ load })),
      },
    };
    const parent = await resolvers.Query.insights(
      null,
      {
        days: 7,
        clientId: " client-a ",
        excludeAgencyId: " 190101 ",
        profileName: "bibdk21",
      },
      context
    );

    await expect(
      resolvers.Insight.arguments(parent, {}, context)
    ).resolves.toEqual([
      expect.objectContaining({ key: "Query.search.q", count: 8 }),
    ]);
    await expect(
      resolvers.Insight.inputFields(parent, {}, context)
    ).resolves.toEqual([
      expect.objectContaining({ key: "SearchInput.filters", count: 5 }),
    ]);

    expect(load.mock.calls[0][0]).toMatchObject({
      path: "/v1/arguments",
      params: {
        clientId: "client-a",
        excludeAgencyId: "190101",
        profileName: "bibdk21",
      },
    });
    expect(load.mock.calls[1][0].path).toBe("/v1/input-fields");
  });

  test("rejects positive and negative filters for the same dimension", async () => {
    config.datasources.traceql.insightsEnabled = true;

    await expect(
      resolvers.Query.insights(null, {
        days: 7,
        clientId: "client-a",
        excludeClientId: "client-b",
      })
    ).rejects.toMatchObject({
      message: "clientId and excludeClientId cannot be combined",
      extensions: { code: "FILTER_CONFLICT" },
    });
  });

  test("omits empty dimension filters", async () => {
    config.datasources.traceql.insightsEnabled = true;

    await expect(
      resolvers.Query.insights(null, {
        days: 7,
        clientId: "  ",
        excludeAgencyId: "",
      })
    ).resolves.not.toHaveProperty("clientId");
  });

  test("uses explicit from/to without applying the legacy days limit", async () => {
    config.datasources.traceql.insightsEnabled = true;
    const load = jest.fn().mockResolvedValue({ fields: [], nextCursor: null });
    const context = {
      datasources: {
        getLoader: jest.fn(() => ({ load })),
      },
    };
    const schema = buildSchema("type Query { placeholder: String }");
    const from = "2025-01-01T00:00:00.000Z";
    const to = "2026-01-01T00:00:00.000Z";
    const parent = await resolvers.Query.insights(
      null,
      { from, to, days: 1 },
      context
    );

    await resolvers.Insight.fields(parent, {}, context, { schema });

    expect(parent).toMatchObject({ start: from, end: to, explicitTo: true });
    expect(load.mock.calls[0][0].params).toMatchObject({ from, to });
  });

  test("rejects invalid explicit intervals", async () => {
    config.datasources.traceql.insightsEnabled = true;

    await expect(
      resolvers.Query.insights(null, {
        from: "2026-01-02T00:00:00.000Z",
        to: "2026-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow("from must be earlier than to");
  });

  test("exposes retention errors as a useful GraphQL error", async () => {
    config.datasources.traceql.insightsEnabled = true;
    const error = Object.assign(new Error("retention"), {
      code: "INTERVAL_OUTSIDE_RETENTION",
      earliestAvailableAt: "2026-06-13T12:00:00.000Z",
    });
    const context = {
      datasources: {
        getLoader: jest.fn(() => ({
          load: jest.fn().mockRejectedValue(error),
        })),
      },
    };
    const schema = buildSchema("type Query { placeholder: String }");
    const parent = await resolvers.Query.insights(null, { days: 90 }, context);

    await expect(
      resolvers.Insight.fields(parent, {}, context, { schema })
    ).rejects.toThrow(
      "Den valgte periode ligger uden for TraceQLs retention-vindue"
    );
  });

  test("maps a safe subset of Auth Admin client configuration", async () => {
    const load = jest.fn().mockResolvedValue({
      displayName: "Example app",
      description: "Public description",
      app: {
        clientId: "client-one",
        grants: ["password", "refresh_token"],
        clientSecret: "must-not-be-exposed",
      },
      gateway: { agencies: { ids: ["190101"] } },
      profile: [{ profileName: "default" }],
      expires: "2027-01-01T00:00:00.000Z",
    });
    const context = {
      datasources: { getLoader: jest.fn(() => ({ load })) },
    };

    const result = await resolvers.FieldClientInsight.configuration(
      { clientId: "client-one" },
      {},
      context
    );

    expect(result).toEqual({
      displayName: "Example app",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-be-exposed");
    expect(load).toHaveBeenCalledWith("client-one");
  });

  test("maps the Auth Admin client response shape", async () => {
    const load = jest.fn().mockResolvedValue({
      id: "client-one",
      name: "Top-level client name",
      config: {
        agencyId: "190101",
        grants: ["password"],
      },
      contact: { owner: "must-not-be-exposed" },
    });
    const context = {
      datasources: { getLoader: jest.fn(() => ({ load })) },
    };

    await expect(
      resolvers.FieldClientInsight.configuration(
        { clientId: "client-one" },
        {},
        context
      )
    ).resolves.toEqual({
      displayName: "Top-level client name",
    });
  });
});
