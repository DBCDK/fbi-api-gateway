import { getExecutableSchema } from "../schemaLoader";
import { parse } from "graphql/language";
import { validate } from "graphql/validation";
import validateComplexity from "../utils/complexity";

let internalSchema;
describe.skip("Complexity analysis", () => {
  beforeEach(async () => {
    if (!internalSchema) {
      internalSchema = await getExecutableSchema({
        loadExternal: false,
        clientPermissions: { admin: true },
      });
    }
  });
  test("Query complexity validation - no errors", () => {
    const query = `{
      work(id: "work-of:870970-basis:48221157") {
        titles {
          main
        }
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
});
