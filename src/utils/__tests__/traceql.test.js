import { buildSchema, GraphQLError, parse } from "graphql";
import {
  extractArgumentKeys,
  createOperationHash,
  extractFieldKeys,
  extractInputFieldKeys,
  extractInputUsage,
  getTraceqlOutcome,
} from "../traceql";

const schema = buildSchema(`
  input SearchFilter { agency: String, categories: [String!] }
  input SearchInput { query: String!, filters: [SearchFilter!] }
  type Query { works(limit: Int, input: SearchInput): [Work!]!, creator: Creator }
  type Work { title: String!, creator(role: String): Creator }
  type Creator { name: String! }
`);

describe("TraceQL GraphQL helpers", () => {
  test("extracts schema-aware fields for only the selected operation", () => {
    const document = parse(`
      query Other { creator { name } }
      query SearchWorks {
        results: works {
          title
          ...WorkCreator
          ... on Work { __typename title }
        }
      }
      fragment WorkCreator on Work { creator { ...CreatorName } }
      fragment CreatorName on Creator { name }
    `);

    expect(extractFieldKeys(schema, document, "SearchWorks")).toEqual([
      "Creator.name",
      "Query.works",
      "Work.creator",
      "Work.title",
    ]);
  });

  test("operation hash ignores operation name and runtime variables", () => {
    const first = parse(`
      query First($limit: Int) { works { title } }
    `);
    const second = parse(`
      query Second($limit: Int) { works { title } }
    `);

    expect(createOperationHash(first, "First")).toBe(
      createOperationHash(second, "Second")
    );
    expect(createOperationHash(first, "First")).toMatch(
      /^v1:sha256:[a-f0-9]{64}$/
    );
  });

  test("extracts argument and supplied input-field names without values", () => {
    const document = parse(`
      query Search($input: SearchInput, $limit: Int) {
        works(input: $input, limit: $limit) { title }
      }
    `);

    expect(
      extractInputUsage(schema, document, "Search", {
        input: {
          query: "must-not-be-returned",
          filters: [{ agency: "190101" }],
        },
        limit: 10,
      })
    ).toEqual({
      arguments: ["Query.works.input", "Query.works.limit"],
      inputFields: [
        "SearchFilter.agency",
        "SearchInput.filters",
        "SearchInput.query",
      ],
    });
  });

  test("uses schema names through aliases and transitive fragments", () => {
    const document = parse(`
      query Other($limit: Int) { works(limit: $limit) { title } }
      query Selected {
        results: works {
          ...WorkDetails
          ... on Work { author: creator(role: "duplicate") { name } }
        }
      }
      fragment WorkDetails on Work { creator(role: "writer") { ...CreatorDetails } }
      fragment CreatorDetails on Creator { name }
    `);

    expect(extractArgumentKeys(schema, document, "Selected")).toEqual([
      "Work.creator.role",
    ]);
  });

  test("extracts and deduplicates nested inline input fields", () => {
    const document = parse(`
      query Search {
        first: works(input: {
          query: "private-query"
          filters: [{ agency: "private-agency" }, { agency: "again" }]
        }) { title }
        second: works(input: { query: "another-private-query" }) { title }
      }
    `);

    expect(extractInputFieldKeys(schema, document, {}, "Search")).toEqual([
      "SearchFilter.agency",
      "SearchInput.filters",
      "SearchInput.query",
    ]);
  });

  test("handles nested variable lists and ignores null variables", () => {
    const document = parse(`
      query Search($input: SearchInput) {
        works(input: $input) { title }
      }
    `);

    expect(
      extractInputFieldKeys(
        schema,
        document,
        {
          input: {
            filters: [
              { agency: "private-one" },
              { agency: "private-two", categories: ["private-category"] },
            ],
          },
        },
        "Search"
      )
    ).toEqual([
      "SearchFilter.agency",
      "SearchFilter.categories",
      "SearchInput.filters",
    ]);
    expect(
      extractInputFieldKeys(schema, document, { input: null }, "Search")
    ).toEqual([]);
  });

  test("does not count omitted variable defaults as supplied input fields", () => {
    const document = parse(`
      query Search($input: SearchInput = { query: "default" }) {
        works(input: $input) { title }
      }
    `);

    expect(extractInputUsage(schema, document, "Search", {})).toEqual({
      arguments: ["Query.works.input"],
      inputFields: [],
    });
  });

  test("returns null or no fields when no operation can be selected", () => {
    const document = parse(
      "query One { works { title } } query Two { creator { name } }"
    );
    expect(createOperationHash(document)).toBeNull();
    expect(extractFieldKeys(schema, document)).toEqual([]);
  });

  test("classifies execution outcomes", () => {
    expect(getTraceqlOutcome({ data: {} })).toBe("success");
    expect(getTraceqlOutcome({ errors: [new GraphQLError("bad input")] })).toBe(
      "graphql_error"
    );
    expect(
      getTraceqlOutcome({
        errors: [
          new GraphQLError(
            "resolver failed",
            null,
            null,
            null,
            null,
            new Error("db")
          ),
        ],
      })
    ).toBe("internal_error");
  });
});
