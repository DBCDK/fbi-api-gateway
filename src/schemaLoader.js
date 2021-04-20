/**
 * @file Responsible for loading the schema
 *
 * It will check all files recursively in ./src/schema
 * and load type definitions and resolvers
 */

import fs from "fs";
import path from "path";
import { makeExecutableSchema, mergeSchemas } from "graphql-tools";
import drupalSchema from "./schema/external/drupal";
import { log } from "dbc-node-logger";

/**
 * Get files recursively
 * @param {string} dir
 * @param {array} result
 */
const getFilesRecursive = function (dir, result = []) {
  // list files in directory and loop through
  fs.readdirSync(dir).forEach((file) => {
    // builds full path of file
    const fPath = path.resolve(dir, file);

    // prepare stats obj
    const fileStats = { file, path: fPath };

    // if its a folder, we get files from that
    if (fs.statSync(fPath).isDirectory()) {
      return getFilesRecursive(fPath, result);
    }

    if (file.endsWith(".js")) {
      result.push(fileStats);
    }
  });
  return result;
};

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
