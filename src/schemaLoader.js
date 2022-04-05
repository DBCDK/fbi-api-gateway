/**
 * @file Responsible for loading the schema
 *
 * It will check all files recursively in ./src/schema
 * and load type definitions and resolvers
 */

import { makeExecutableSchema, mergeSchemas } from "@graphql-tools/schema";
import { wrapSchema } from "@graphql-tools/wrap";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { filterSchema, pruneSchema } from "@graphql-tools/utils";

import { typeDefs as scalarTypeDefs } from "graphql-scalars";
import { resolvers as scalarResolvers } from "graphql-scalars";
import { log } from "dbc-node-logger";

import drupalSchema from "./schema/external/drupal";
import { getFilesRecursive } from "./utils/utils";
import { wrapResolvers } from "./utils/wrapResolvers";
import permissions from "./permissions.json";
import merge from "lodash/merge";

// Stores the transformed schemas
const schemaCache = {};

// The external schema (headless Drupal)
let externalSchema;

// The internal schema
let internalSchema = makeExecutableSchema(schemaLoader());

/**
 * PermissionTransform  is used to remove parts of the schema
 * as dictated by a given smaug client configuration
 */
class PermissionsTransform {
  constructor(clientPermissions) {
    this.clientPermissions = clientPermissions;
  }
  transformSchema(originalWrappingSchema) {
    return pruneSchema(
      filterSchema({
        schema: originalWrappingSchema,
        rootFieldFilter: (operationName, fieldName) =>
          this.clientPermissions?.allowRootFields?.includes(fieldName),
        typeFilter: (typeName) =>
          !this.clientPermissions?.denyTypes?.includes(typeName),
        // fieldFilter: (typeName, fieldName) => true,
        // argumentFilter: (typeName, fieldName, argName) => true
      })
    );
  }
}

/**
 * Will load all files in schema folder
 * and look for type definitions and resolvers.
 */
function schemaLoader() {
  let allTypeDefs = [...scalarTypeDefs];
  let allResolvers = { ...scalarResolvers };

  // Load files in schema folder
  const files = getFilesRecursive(`${__dirname}/schema`);

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
      allResolvers = merge({}, allResolvers, resolvers);
    }
  });

  return { typeDefs: mergeTypeDefs(allTypeDefs), resolvers: allResolvers };
}

/**
 * Gets an executable schema that is transformed
 * according to the permissions of the smaug client.
 */
export async function getExecutableSchema({
  loadExternal = true,
  clientPermissions = permissions.default,
  hasAccessToken,
}) {
  const key = JSON.stringify({ hasAccessToken, clientPermissions });

  if (!schemaCache[key]) {
    // Fetch external Drupal schema (bibdk)
    if (!externalSchema && loadExternal) {
      externalSchema = await drupalSchema();
    }

    // Merge external and internal schemas
    const mergedSchema = loadExternal
      ? mergeSchemas({
          schemas: [externalSchema, internalSchema],
        })
      : internalSchema;

    // Filter schema according to permissions of Smaug client
    // If no valid accessToken is given (no smaug client), we allow to introspect
    // the entire schema (useful for test purposes). But no data is accessible.
    const filteredSchema =
      clientPermissions?.admin || !hasAccessToken
        ? mergedSchema
        : wrapSchema({
            schema: mergedSchema,
            transforms: [new PermissionsTransform(clientPermissions)],
          });

    // Wrap all resolvers with error logger
    wrapResolvers(filteredSchema, (resolveFn) => {
      async function errorLogger(...args) {
        const result = await resolveFn(...args);
        if (result instanceof Error) {
          log.error(result.message, {
            error: String(result),
            stacktrace: result.stack,
          });
        }
        return result;
      }
      return errorLogger;
    });

    schemaCache[key] = filteredSchema;
  }

  return schemaCache[key];
}
