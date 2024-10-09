/**
 * @file This file tests the complexity estimator function, which is evaluated in in graphql validator
 *
 */

import { parse } from "graphql/language";
import { validate } from "graphql/validation";

import { performTestQuery } from "../utils/utils";
import { createMockedDataLoaders } from "../datasourceLoader";

import { getExecutableSchema } from "../schemaLoader";
import { validateQueryDepth } from "../utils/depth";

let internalSchema;
describe("Query depth validation", () => {
  beforeEach(async () => {
    if (!internalSchema) {
      internalSchema = await getExecutableSchema({
        loadExternal: false,
        clientPermissions: { admin: true },
      });
    }
  });

  it("Should return statusCode '400' for queries exceeding the depth limit", async () => {
    const query = `query depth {
                          __schema {
                            types {
                              fields {
                                type {
                                  fields {
                                    type {
                                      fields {
                                        type {
                                          fields {
                                            type {
                                              fields {
                                                type {
                                                  fields {
                                                    type {
                                                      fields {
                                                        type {
                                                          name
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }`;

    const ast = parse(query);

    // Find root-operationen (query/mutation/subscription)
    const node = ast.definitions.find(
      (def) => def.kind === "OperationDefinition"
    );

    const result = validateQueryDepth(node);

    expect(result).toEqual({
      value: 16,
      statusCode: 400,
      message: `'depth' exceeds maximum operation depth of 15`,
    });

    // expect(result).toMatchSnapshot();
  });

  it("Should return statusCode '200' on queries NOT exceeding the depth limit", async () => {
    const query = `query depth {
                    __schema {
                      types {
                        fields {
                          type {
                            fields {
                              type {
                                name
                              }
                            }
                          }
                        }
                      }
                    }
                  }`;

    const ast = parse(query);

    // Find root-operationen (query/mutation/subscription)
    const node = ast.definitions.find(
      (def) => def.kind === "OperationDefinition"
    );

    const result = validateQueryDepth(node);

    expect(result).toEqual({
      value: 7,
      statusCode: 200,
    });
  });
});
