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
import { parseClientPermissions } from "../commonUtils";
import enumFallbackDirective from "./utils/enumFallbackDirective";

const {
  enumFallbackDirectiveTypeDefs,
  enumFallbackDirectiveTransformer,
} = enumFallbackDirective();

// Stores the transformed schemas
const schemaCache = {};

// The external schema (headless Drupal)
let externalSchema;

// The internal schema
let internalSchema = enumFallbackDirectiveTransformer(
  makeExecutableSchema(fieldNameValidator(schemaLoader()))
);

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
 * field/subfield validator
 *
 * Testing for:
 * Unique subfield names (regardless of UPPER/lower case)
 * Enums written in UPPERCASE
 * Types written in PascalCase
 *
 * Notes: ignores deprecated fields
 * Directive definitions are excepted
 *
 * @param {Schema} props
 * @returns {object}
 */

// dev mode only
export function fieldNameValidator(props) {
  //  This check is NOT for production
  if (process.env.NODE_ENV === "production") {
    return props;
  }

  // Kind/type categories to omit
  const omit = ["DirectiveDefinition"];

  // All fields and subfields in lowercase
  let lowerCasedTypeNames = [];

  // schema
  const typeDefs = props.typeDefs;

  typeDefs?.definitions?.forEach((obj) => {
    const field = obj?.name?.value;
    const shouldOmit = omit.includes(obj?.kind);

    // field name exist
    if (field) {
      // Tjek if the type of field is omitted
      if (!shouldOmit) {
        // Check for field name doublets
        if (lowerCasedTypeNames.includes(field?.toLowerCase())) {
          console.log(`Type name '${field}' (${obj?.kind}) is already used`);

          // throw new Error(
          //   `Type name '${field}' (${obj?.kind}) is already used`
          // );
        }

        // Add to name doublet array
        lowerCasedTypeNames.push(field?.toLowerCase());

        // Ensure first letter in type def is uppercase
        if (/^\p{Ll}/u.test(field)) {
          console.log(
            `Type '${field}' (${obj?.kind}) is a TypeDefinition and should be written in PascalCase`
          );
          // throw new Error(
          //   `Type '${field}' (${obj?.kind}) is a TypeDefinition and should be written in PascalCase`
          // );
        }
      }

      /**
       * Subfields check
       */

      // ObjectTypeDefinition uses .fields and EnumValueDefinition uses .values
      const subfields = obj?.fields || obj?.values;

      // Check the subfields of the typedef obj
      subfields?.forEach((obj) => {
        const subfield = obj?.name?.value;
        const kind = obj?.kind;
        const isDeprecated = !!obj?.directives.find(
          (obj) => obj.name.value === "deprecated"
        );

        // All fields and subfields in lowercase
        let lowerCasedFieldNames = [];

        // ignore deprecated fields
        if (!isDeprecated) {
          // has subfields
          if (subfield) {
            // handle enum subfields (all UPPERCASE check)
            if (kind === "EnumValueDefinition") {
              //  ensure enums is written all uppercase
              if (subfield !== subfield?.toUpperCase()) {
                console.log(
                  `Field '${subfield}' in type '${field}' (${obj?.kind}) is an enum and should be written all UPPERCASE`
                );
                // throw new Error(
                //   `Field '${subfield}' in type '${field}' (${obj?.kind}) is an enum and should be written all UPPERCASE`
                // );
              }
            }

            // handle if subfield name already exist
            if (lowerCasedFieldNames.includes(subfield?.toLowerCase())) {
              console.log(
                `Field name '${subfield}' in '${field}' is already used`
              );
              // throw new Error(
              //   `Field name '${subfield}' in '${field}' is already used`
              // );
            }

            //  add to name doublet array
            lowerCasedFieldNames.push(subfield?.toLowerCase());
          }
        }
      });
    }
  });

  return props;
}

/**
 * Will load all files in schema folder
 * and look for type definitions and resolvers.
 */
function schemaLoader() {
  let allTypeDefs = [enumFallbackDirectiveTypeDefs, ...scalarTypeDefs];
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
      log.debug(`Found type definition in ${file.path}`);
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
  clientPermissions,
  hasAccessToken,
}) {
  const parsedPermissions = parseClientPermissions({
    smaug: clientPermissions,
  });

  const key = JSON.stringify({ hasAccessToken, parsedPermissions });

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
      parsedPermissions?.admin || !hasAccessToken
        ? mergedSchema
        : wrapSchema({
            schema: mergedSchema,
            transforms: [new PermissionsTransform(parsedPermissions)],
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
