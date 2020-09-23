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
import { internalSchema } from "../schema/schema";
import mockedWorkDataSource from "../datasources/mocked/work.datasource.mocked";

async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

describe("API test cases", () => {
  test("Get all work fields that do not require nested requests", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              creators
              description
              fullTitle
              manifestations {
                creators
                description
                fullTitle
                materialType
                pid
                subjects
                title
              }
              materialTypes {
                creators
                description
                fullTitle
                materialType
                pid
                subjects
                title
              }
              path
              subjects
              title
            }
          }
        `,
      variables: { id: "work-of:870970-basis:26521556" },
      context: { datasources: { workservice: mockedWorkDataSource } }
    });
    expect(result).toMatchSnapshot();
  });

  test("Materialtypes should contain one manifestation per type - prefer 870970-basis", async () => {
    const result = await performTestQuery({
      query: `
          query ($id: String!) {
            work(id: $id) {
              materialTypes {
                pid
                materialType
              }
            }
          }
        `,
      variables: { id: "work-of:870970-basis:26521556" },
      context: { datasources: { workservice: mockedWorkDataSource } }
    });
    expect(result).toEqual({
      data: {
        work: {
          materialTypes: [
            { pid: "870970-basis:29433909", materialType: "Bog" },
            { pid: "300101-katalog:28486006", materialType: "Ebog" }
          ]
        }
      }
    });
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
      context: { datasources: { workservice: mockedWorkDataSource } }
    });
    expect(result).toMatchObject({
      errors: [
        {
          message: 'Cannot query field "dunno" on type "Work".'
        }
      ]
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
      context: { datasources: { workservice: mockedWorkDataSource } }
    });

    expect(result).toMatchObject({
      errors: [
        {
          message: 'Variable "$id" of required type "String!" was not provided.'
        }
      ]
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
      context: { datasources: { workservice: mockedWorkDataSource } }
    });
    expect(result).toMatchObject({
      errors: [
        {
          message: "Syntax Error: Expected Name, found <EOF>."
        }
      ]
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
            get: () => {
              throw new Error("Not Found");
            }
          }
        }
      }
    });
    expect(result).toMatchObject({
      errors: [
        {
          message: "Not Found",
          path: ["work"]
        }
      ],
      data: null
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
