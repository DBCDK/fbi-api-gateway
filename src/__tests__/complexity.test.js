import { parse } from "graphql/language";
import { validate } from "graphql/validation";

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

  test("Query complexity validation - Exceed complexity limit ", () => {
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
          limit: 100,
        },
      }),
    ]);

    expect(errors).toMatchSnapshot();
  });
});
