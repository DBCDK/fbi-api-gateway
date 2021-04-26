/**
 * @file Responsible for loading the schema
 *
 * It will check all files recursively in ./src/schema
 * and load type definitions and resolvers
 */

import { makeExecutableSchema, mergeSchemas } from "graphql-tools";
import drupalSchema from "./schema/external/drupal";
import { log } from "dbc-node-logger";
import { getFilesRecursive } from "./utils/utils";

/**
 * Will check all files in schema folder
 * for type definitions and resolvers.
 *
 * These are then loaded
 */
function schemaLoader() {
  let allTypeDefs = [];
  let allResolvers = {};

  // Load files in schema folder
  const files = getFilesRecursive("./src/schema");

  // Require typeDefs and resolvers
  files.forEach((file) => {
    if (!file.path.endsWith(".js")) {
      return;
    }
    const { typeDef, resolvers } = require(file.path);
    if (typeDef) {
      allTypeDefs = [...allTypeDefs, typeDef];
      log.info(`Found type definition in ${file.path}`);
    }
    if (resolvers) {
      allResolvers = { ...allResolvers, ...resolvers };
    }
  });

  return { typeDefs: allTypeDefs, resolvers: allResolvers };
}

const { typeDefs, resolvers } = schemaLoader();

/**
 * Create executable schema from type definitions and resolvers
 */
export const internalSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

/**
 * We stitch the internal schema together with the external drupal schema
 */
export default async () => {
  return mergeSchemas({
    subschemas: [{ schema: await drupalSchema() }, { schema: internalSchema }],
  });
};
