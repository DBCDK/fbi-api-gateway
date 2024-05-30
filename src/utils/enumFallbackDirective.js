/**
 * @file Provides a custom `@fallback` directive for GraphQL enums to specify default values.
 * The directive ensures that if a resolver returns an invalid or undefined enum value,
 * a predefined default value is used instead.
 */

import { defaultFieldResolver, isNonNullType, isEnumType } from "graphql";
import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { log } from "dbc-node-logger";

/**
 * Function to create the enum fallback directive
 */
export default function enumFallbackDirective() {
  return {
    // Define the directive in the schema
    enumFallbackDirectiveTypeDefs: `directive @fallback on ENUM_VALUE`,

    // Transformer function to apply the directive to the schema
    enumFallbackDirectiveTransformer: (schema) => {
      // Object to store the fallback values for each enum type
      const fallbackEnumValues = {};

      // Map through the schema and process directives
      return mapSchema(schema, {
        // Process enum values to find those with the @fallback directive
        [MapperKind.ENUM_VALUE](enumValueConfig, enumTypeName) {
          // Check if the enum value has the @fallback directive
          const fallbackDirective = getDirective(
            schema,
            enumValueConfig,
            "fallback"
          )?.[0];

          // If the @fallback directive is present, store the enum value as the fallback
          if (fallbackDirective) {
            fallbackEnumValues[enumTypeName] = enumValueConfig.value;
            return enumValueConfig;
          }
        },

        // Process object fields to potentially wrap their resolvers
        [MapperKind.OBJECT_FIELD](fieldConfig) {
          // Save the original resolver or use the default one
          const originalResolver = fieldConfig.resolve || defaultFieldResolver;

          // Get the return type of the field
          let returnType = fieldConfig.type;

          // Check if null is allowed for this field
          const nullAllowed = !isNonNullType(returnType);

          if (!nullAllowed) {
            returnType = returnType.ofType;
          }

          // Check if the return type is an enum type and get the enum type if it is
          const enumType = isEnumType(returnType) && returnType;
          const enumTypeName = enumType?.name;

          // Get all possible values of the enum type
          const enumValues = enumType
            ?.getValues?.()
            ?.map((value) => value.name);

          // Create a set of valid enum values for quick lookup
          const enumValuesSet = enumValues && new Set(enumValues);

          // Determine the default enum value, either the fallback or the first value
          const defaultEnumValue =
            fallbackEnumValues[enumTypeName] || enumValues?.[0];

          // If the field's return type is an enum type, wrap its resolver
          if (enumType) {
            fieldConfig.resolve = async (source, args, context, info) => {
              // Call the original resolver to get the result
              const orgRes = await originalResolver(
                source,
                args,
                context,
                info
              );

              // If the result is null or undefined and null is allowed, return null
              if (
                (orgRes === null || typeof orgRes === "undefined") &&
                nullAllowed
              ) {
                return null;
              }

              // If the result is a valid enum value, return it
              if (enumValuesSet.has(orgRes)) {
                return orgRes;
              }

              // Log an error if the resolver returned an unsupported enum value
              log.error(`UNSUPPORTED ENUM: ${enumTypeName}.${orgRes}`);

              // Return the default enum value to prevent the query from breaking
              return defaultEnumValue;
            };
          }
        },
      });
    },
  };
}
