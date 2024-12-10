/**
 * @file Responsible for loading the schema
 *
 * It will check all files recursively in ./src/schema
 * and load type definitions and resolvers
 */
import { startCase } from "lodash";

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

import merge from "lodash/merge";
import { parseClientPermissions } from "../commonUtils";
import enumFallbackDirective from "./utils/enumFallbackDirective";

const { enumFallbackDirectiveTypeDefs, enumFallbackDirectiveTransformer } =
  enumFallbackDirective();

// Stores the transformed schemas
const schemaCache = {};

// The external schema (headless Drupal)
let externalSchema;

// The internal schema
let internalSchema = enumFallbackDirectiveTransformer(
  makeExecutableSchema(fieldNameValidatorEnv(schemaLoader()))
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
 * Runs the fieldNameValidator function if environment is NOT production
 *
 * @param {Schema} props
 * @param {string} errorType (THROW | LOG | IGNORE)
 * @returns {object}
 */
function fieldNameValidatorEnv(props, errorType = "THROW") {
  if (process.env.NODE_ENV === "production") {
    return props;
  }

  return fieldNameValidator(props, errorType);
}

/**
 * Type, field/subfield validator
 *
 * Function is testing for:
 *
 * ObjectTypes i written in PascalCase (starting with a Capital letter)
 * Unique Type subfield names (regardless of UPPER/lower case)
 * EnumType values is written in all UPPERCASE
 * Types written in PascalCase
 * InputTypes endping with 'Input'
 * ScalarTypes ending with 'Scalar'
 * EnumTypes ending with 'Enum'
 * UnionTypes ending with 'Union'
 * InterfaceTypes ending with 'Interface'
 *
 * Notes: The naming standard for deprecated fields are ignored ---> this check can be removed in future
 * Directive definitions are excepted
 *
 * Deprecation 'reason' are also validated.
 * A deprecation reason should contain a expration date in the dd/mm-yyyy format.
 *
 * @param {Schema} props
 * @param {string} errorType (THROW | LOG | IGNORE)
 * @returns {object}
 */

// dev mode only
export function fieldNameValidator(props, errorType = "THROW") {
  //  This check is NOT for production

  if (errorType === "LOG") {
    console.info(
      "########################### Field validations ###########################"
    );
    console.info(" ");
  }

  let hasError;

  // Function to handle Error messages (throw|log|ignore)
  function handleError(message) {
    hasError = true;
    if (errorType === "THROW") {
      throw new Error(message);
    }
    errorType === "LOG" && console.error(message);
  }

  // Kind/type categories to omit
  const omit = ["DirectiveDefinition"];

  // Kinds/types which should be a part of the tailing typeNameDefintion. e.g. UserStatus(Enum), User(Input)
  const tailedTypes = [
    "EnumTypeDefinition",
    "InputObjectTypeDefinition",
    "UnionTypeDefinition",
    "ScalarTypeDefinition",
    "InterfaceTypeDefinition",
  ];

  // All fields and subfields in lowercase
  let lowerCasedTypeNames = [];

  // schema
  const typeDefs = props.typeDefs;

  typeDefs?.definitions?.forEach((obj) => {
    const field = obj?.name?.value;
    const shouldOmit = omit.includes(obj?.kind);
    const shouldHaveTypedTailing = tailedTypes.includes(obj?.kind);

    // field name exist
    if (field) {
      // Tjek if the type of field is omitted
      if (!shouldOmit) {
        // Check for field name doublets
        if (lowerCasedTypeNames.includes(field?.toLowerCase())) {
          handleError(`Type name '${field}' (${obj?.kind}) is already used`);
        }

        // Add to name doublet array
        lowerCasedTypeNames.push(field?.toLowerCase());

        // Ensure first letter in type def is uppercase
        if (/^\p{Ll}/u.test(field)) {
          handleError(
            `Type '${field}' (${obj?.kind}) is a TypeDefinition and should be written in PascalCase`
          );
        }

        // Ensure correct tailed naming for Enum and Input types
        if (shouldHaveTypedTailing) {
          // Returns the first string in PascalCased type/kind e.g. Enum, Union, Interface
          const tail = startCase(obj?.kind).split(" ")[0];

          if (!field.endsWith(tail)) {
            handleError(
              `Type '${field}' is a ${obj?.kind} which should always end with '${tail}'`
            );
          }
        }
      }

      /**
       * Subfields check
       */

      // ObjectTypeDefinition uses .fields and EnumValueDefinition uses .values
      const subfields = obj?.fields || obj?.values;

      // All subfields in lowercase
      let lowerCasedFieldNames = [];

      // Check the subfields of the typedef obj
      subfields?.forEach((obj) => {
        const subfield = obj?.name?.value;
        const kind = obj?.kind;
        const isDeprecated = !!obj?.directives?.find(
          (obj) => obj?.name?.value === "deprecated"
        );

        // ignore deprecated fields
        if (!isDeprecated) {
          // has subfields
          if (subfield) {
            // handle enum subfields (all UPPERCASE check)
            if (kind === "EnumValueDefinition") {
              //  ensure enums is written all uppercase
              if (subfield !== subfield?.toUpperCase()) {
                handleError(
                  `Field '${subfield}' in type '${field}' (${obj?.kind}) is an enum and should be written all UPPERCASE`
                );
              }
            }

            // handle if subfield name already exist
            if (lowerCasedFieldNames.includes(subfield?.toLowerCase())) {
              handleError(
                `Field name '${subfield}' in '${field}' is already used`
              );
            }

            //  add to name doublet array
            lowerCasedFieldNames.push(subfield?.toLowerCase());
          }
        }
      });

      /**
       * Deprecated fields check
       */
      subfields?.forEach((obj) => {
        const subfield = obj?.name?.value;
        const isDeprecated = !!obj?.directives?.find(
          (obj) => obj?.name?.value === "deprecated"
        );

        if (isDeprecated) {
          const target = obj?.directives?.find(
            (obj) => obj?.name?.value === "deprecated"
          );

          const reason = target?.arguments?.find(
            ({ name }) => name?.value === "reason"
          );

          const value = reason?.value?.value;

          // ensure reason includes an expires string and date has correct format
          if (
            !/expires: (0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[1,2])-(20)\d{2}/.test(
              value
            )
          ) {
            handleError(
              `Deprecated field name '${subfield}' in '${field}' has wrong deprecation format. 

              >>> Deprecation should contain a short text with an 'expires: dd/mm-yyyy suffix'
              `
            );
          }
        }
      });
    }
  });

  //  If error handling type is "LOG"
  if (errorType === "LOG") {
    if (!hasError) {
      console.info("... No field validation errors was found");
    }
    console.info(" ");
    console.info(
      "#########################################################################"
    );
  }

  return props;
}

/**
 * Will load all files in schema folder
 * and look for type definitions and resolvers.
 */
export function schemaLoader() {
  // Custom selected scalar type defs (from graphiql-scalar lib)
  const customScalarTypeDefs = ["DateTime"];

  const _scalarResolvers = {};
  const _scalarTypeDefs = [];

  customScalarTypeDefs.forEach((val) => {
    if (scalarTypeDefs.includes(`scalar ${val}`)) {
      _scalarResolvers[`${val}Scalar`] = scalarResolvers[val];
      _scalarTypeDefs.push(`scalar ${val}Scalar`);
    }
  });

  let allTypeDefs = [enumFallbackDirectiveTypeDefs, ..._scalarTypeDefs];

  let allResolvers = { ..._scalarResolvers };

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
