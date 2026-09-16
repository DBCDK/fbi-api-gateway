import { buildSchema, parse } from "graphql";
import { testing } from "../traceqlUsage";

describe("TraceQL usage events", () => {
  test("builds a usage event without token or raw query data", () => {
    const schema = buildSchema(`
      input WorkFilter { language: String }
      type Query { works(filter: WorkFilter): [Work!]! }
      type Work { title: String! }
    `);
    const document = parse(`
      query SearchWorks($filter: WorkFilter) {
        works(filter: $filter) { title }
      }
    `);
    const req = {
      accessToken: "secret-token",
      profile: { agency: "190101", name: "default" },
      datasources: { stats: { uuid: "request-1" } },
      traceqlUsage: {
        usedAt: "2026-09-10T10:00:00.000Z",
        startedAtMs: performance.now(),
      },
      queryVariables: {
        filter: { language: "dan" },
      },
    };

    const event = testing.createEvent(req, schema, document, "SearchWorks", {
      data: { works: [] },
    });

    expect(event).toMatchObject({
      requestId: "request-1",
      operationType: "query",
      operationName: "SearchWorks",
      agencyId: "190101",
      profileName: "default",
      outcome: "success",
      fields: ["Query.works", "Work.title"],
      arguments: ["Query.works.filter"],
      inputFields: ["WorkFilter.language"],
      usedAt: "2026-09-10T10:00:00.000Z",
    });
    expect(event.operationHash).toMatch(/^v1:sha256:[a-f0-9]{64}$/);
    expect(event).not.toHaveProperty("accessToken");
    expect(event).not.toHaveProperty("query");
    expect(event).not.toHaveProperty("variables");
    expect(JSON.stringify(event)).not.toContain("secret-token");
    expect(JSON.stringify(event)).not.toContain("dan");
  });

  test("keeps arguments and inputFields optional", () => {
    const schema = buildSchema("type Query { status: String }");
    const document = parse("query Status { status }");
    const req = {
      accessToken: "token",
      datasources: { stats: { uuid: "request-without-input" } },
      traceqlUsage: {
        usedAt: "2026-09-11T10:00:00.000Z",
        startedAtMs: performance.now(),
      },
    };

    const event = testing.createEvent(req, schema, document, "Status", {
      data: { status: "ok" },
    });

    expect(event).not.toHaveProperty("arguments");
    expect(event).not.toHaveProperty("inputFields");
  });

  test("does not create an event for a meta-field-only operation", () => {
    const schema = buildSchema("type Query { value: String }");
    const document = parse("query SchemaName { __typename }");
    const req = {
      accessToken: "token",
      datasources: { stats: { uuid: "request-2" } },
      traceqlUsage: {
        usedAt: "2026-09-10T10:00:00.000Z",
        startedAtMs: performance.now(),
      },
    };

    expect(
      testing.createEvent(req, schema, document, "SchemaName", { data: {} })
    ).toBeNull();
  });
});
