/**
 * @file This file tests the complexity estimator function, which returns a complexity value as an integer (real-time)
 *
 */

import { getExecutableSchema } from "../../schemaLoader";
import { getQueryComplexity } from "../complexity";

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

    const complexity = getQueryComplexity({
      schema: internalSchema,
      query,
      variables: {
        pid: "870970-basis:55139784",
        limit: 10,
      },
    });

    expect(complexity).toBeLessThan(1000);
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

    const complexity = getQueryComplexity({
      schema: internalSchema,
      query,
      variables: {
        pid: "870970-basis:55139784",
        limit: 100,
      },
    });

    expect(complexity).toBeGreaterThanOrEqual(1000);
  });
});
