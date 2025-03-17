/**
 * @file This file tests the complexity estimator function, which is evaluated in in graphql validator
 *
 */

import { parse, validate, GraphQLError } from "graphql";

import { getExecutableSchema } from "../schemaLoader";
import { validateQueryComplexity } from "../utils/complexity";

let internalSchema;
describe("Complexity validation", () => {
  beforeEach(async () => {
    if (!internalSchema) {
      internalSchema = await getExecutableSchema({
        loadExternal: false,
        clientPermissions: { admin: true },
      });
    }
  });

  test("Query complexity validation - OK ", () => {
    const query = `query Test_WorkRecommendations($pid: String!, $limit: Int!) {
        recommend(pid: $pid, limit: $limit) {
          result {
            work {
              workId
              titles {
                main
              }
              creators {
                display
              }
            }
          }
        }
      }
    `;
    const ast = parse(query);
    const errors = validate(internalSchema, ast, [
      validateQueryComplexity({
        query,
        variables: {
          pid: "870970-basis:55139784",
          limit: 10,
        },
      }),
    ]);

    expect(errors).toMatchSnapshot();
  });

  test("Query complexity validation with custom limit 100 - REJECTED", () => {
    const query = `query Test_WorkRecommendations($pid: String!, $limit: Int!) {
        recommend(pid: $pid, limit: $limit) {
          result {
            work {
              workId
              titles {
                main
              }
              creators {
                display
              }
            }
          }
        }
      }
    `;

    const ast = parse(query);
    const errors = validate(internalSchema, ast, [
      validateQueryComplexity({
        query,
        limit: 100, // 👈 Custom limit på 100
        variables: {
          pid: "870970-basis:55139784",
          limit: 10, // 👈 Bruger prøver at overskride grænsen
        },
      }),
    ]);

    // 🔹 Kontroller, at der rent faktisk er en fejl
    expect(errors).not.toHaveLength(0);

    // 🔹 Kontroller, at fejlen er en GraphQLError med korrekt besked
    expect(errors[0]).toBeInstanceOf(GraphQLError);
    expect(errors[0].message).toContain("Query is too complex");

    // 🔹 Tjek om den præcise fejlmeddelelse matcher den forventede
    expect(errors[0].message).toMatch(/Maximum allowed complexity: \d+/);
  });

  test("Query complexity validation - Exceed global complexity limit 25000", () => {
    const query = `query Test_WorkRecommendations($pid: String!, $limit: Int!) {
        recommend(pid: $pid, limit: $limit) {
          result {
            work {
              workId
              titles {
                main
              }
              creators {
                display
              }
            }
          }
        }
      }
    `;
    const ast = parse(query);
    const errors = validate(internalSchema, ast, [
      validateQueryComplexity({
        query,
        variables: {
          pid: "870970-basis:55139784",
          limit: 5000,
        },
      }),
    ]);

    expect(errors).toMatchSnapshot();
  });
});
