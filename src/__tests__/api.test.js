/**
 * @file This file contains tests for the GraphQL API
 *
 * We want to ensure:
 *  - That fields can be retrieved as expected. If a type is changed, these tests should
 *    generally still work. Changes should be backwards compatible.
 *  - Error handling works.
 *  - Proper handling of insane/complex queries. For instance, highly nested queries
 *    that results in explosion of requests to underlying services.
 *
 * Error handling:
 *  - User errors. Query syntax errors, Queries that do not adhere to the schema, missing variables etc.
 *  - Datasource errors. Data from datasource with wrong format. Data not found.
 *    If we don't validate, these will probably lead to resolver errors.
 *  - Resolver errors. Bugs in resolvers, datasource errors may lead to resolver errors.
 *    We should have these logged, to be able to identify whether its a resolver bug or datasource bug
 *  - Network errors.
 *
 * It should be possible for users of the API to discern from the respone what type of error
 * they are getting. THIS IS STILL WORK IN PROGRESS
 *
 */

import { graphql } from "graphql";
import { validate } from "graphql/validation";
import { parse } from "graphql/language";
import { internalSchema } from "../schemaLoader";
import validateComplexity from "../utils/complexity";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

describe("API test cases", () => {
  let spy = {};

  beforeEach(() => {
    spy.console = jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    spy.console.mockClear();
  });

  afterAll(() => {
    spy.console.mockRestore();
  });
  test("Query complexity validation - no errors", () => {
    const query = `{
      work(id: "work-of:870970-basis:48221157") {
        title
        manifestations {
          recommendations {
            value
            manifestation {
              abstract
            }
          }
        }
      }
    }
    `;
    const ast = parse(query);
    const errors = validate(internalSchema, ast, [
      validateComplexity({
        query,
        variables: {},
      }),
    ]);
    expect(errors).toMatchSnapshot();
  });
  test("Query complexity validation - exceeding complexitylimit", () => {
    const query = `{
      work(id: "work-of:870970-basis:48221157") {
        title
        manifestations {
          recommendations {
            value
            manifestation {
              abstract
              recommendations {
                value
              }
            }
          }
        }
      }
    }
    `;
    const ast = parse(query);
    const errors = validate(internalSchema, ast, [
      validateComplexity({
        query,
        variables: {},
      }),
    ]);
    expect(errors).toMatchSnapshot();
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
            search_query: "harry",
            search_query_hit: 7,
            search_query_work: "some-work-id",
            session_id: "some-session-id",
          },
        },
      },
      context: { smaug: { app: { ips: ["some-ip"] } } },
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
        "search-query": "harry",
        "search-query-hit": 7,
        "search-query-work": "some-work-id",
        "session-id": "some-session-id",
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
            search_query: "harry",
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
  test("Get all work fields", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
                creators {
                  type
                  name
                }
                description
                fullTitle
                manifestations {
                  content
                  creators {
                    functionCode
                    functionSingular
                    name
                  }
                  datePublished
                  dk5 {
                    searchCode
                    searchString
                    value
                  }
                  edition
                  hostPublication {
                    title
                    details
                  }
                  isbn
                  materialType
                  notes
                  onlineAccess {
                    ... on UrlReference {
                      url
                      origin
                      note
                    }
                    ... on InfomediaReference {
                      infomediaId
                    }
                  }
                  originals
                  originalTitle
                  language
                  physicalDescription
                  publisher
                  shelf
                  availability {
                    willLend
                    expectedDelivery
                    orderPossible
                    orderPossibleReason
                  }
                }
                materialTypes {
                  materialType
                  manifestations {
                    content
                    creators {
                      functionCode
                      functionSingular
                      name
                    }
                    datePublished
                    dk5 {
                      searchCode
                      searchString
                      value
                    }
                    edition
                    isbn
                    materialType
                    notes
                    onlineAccess {
                      ... on UrlReference {
                        url
                        origin
                        note
                      }
                      ... on InfomediaReference {
                        infomediaId
                      }
                    }
                    originals
                    originalTitle
                    language
                    physicalDescription
                    publisher
                    shelf
                  }
                }
                path
                reviews {
                  __typename
                  ... on ReviewInfomedia {
                    author
                    date
                    media
                    rating
                    reference {
                      infomediaId
                    }
                  }
                  ... on ReviewExternalMedia {
                    author
                    date
                    media
                    url
                  }
                  ... on ReviewMatVurd {
                    author
                    date
                    all {
                      text
                    }
                    about {
                      text
                    }
                    description {
                      text
                    }
                    evaluation {
                      text
                    }
                    other {
                      text
                    }
                  }
                }
                seo {
                  title
                  description
                }
                subjects {
                  type
                  value
                }
                series {
                  part
                  title
                  works {
                    id
                    title
                  }
                }
                title
                workTypes
              }
          }
        `,
      variables: { id: "work-of:870970-basis:26521556" },
      context: {
        accessToken: "qwerty",
        datasources: createMockedDataLoaders(),
      },
    });
    expect(result).toMatchSnapshot();
  });

  test("Work -> review: infomedia review returns content", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              reviews {
                __typename
                ... on ReviewInfomedia {
                  author
                  date
                  media
                  rating
                  reference {
                    pid
                    infomediaId
                  }
                }
              }
            }
          }
        `,
      variables: { id: "work-of:870970-basis:47051649" },
      context: { datasources: createMockedDataLoaders() },
    });

    expect(result).toMatchSnapshot();
  });

  test("Work -> series: Get series info", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              series {
                part
                title
                works {
                  id
                  title
                }
              }
            }
          }
        `,
      variables: { id: "work-of:870970-basis:52557240" },
      context: { datasources: createMockedDataLoaders() },
    });

    expect(result).toMatchSnapshot();
  });

  test("User error: query with unknown field", async () => {
    const result = await performTestQuery({
      query: `
              query ($id: String!) {
                work(id: $id) {
                  dunno
                }
              }
            `,
      variables: { id: "work-of:870970-basis:26521556" },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchObject({
      errors: [
        {
          message: 'Cannot query field "dunno" on type "Work".',
        },
      ],
    });
  });

  test("User error: Query missing variable", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              title
            }
          }
        `,
      variables: {},
      context: { datasources: createMockedDataLoaders() },
    });

    expect(result).toMatchObject({
      errors: [
        {
          message:
            'Variable "$id" of required type "String!" was not provided.',
        },
      ],
    });
  });

  test("User error: syntax error", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              title
            
          }
        `,
      variables: {},
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchObject({
      errors: [
        {
          message: "Syntax Error: Expected Name, found <EOF>.",
        },
      ],
    });
  });

  test("Work not found", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              title
              manifestations {
                pid
              }
            }
          }
        `,
      variables: { id: "some-id" },
      context: {
        datasources: {
          workservice: {
            load: () => {
              throw new Error("Not Found");
            },
          },
        },
      },
    });
    expect(result).toMatchObject({
      errors: [
        {
          message: "Not Found",
          path: ["work"],
        },
      ],
      data: {
        work: null,
      },
    });
  });

  test("Datasource error: Invalid work response", async () => {
    // TODO
    // How should they be presented for user, and what about logging?
  });

  test("Network error: datasource down", async () => {
    // TODO
    // How should they be presented for user, and what about logging?
  });
});
