/**
 * @file Modified version of graphql printSchema functionality
 * with support for syntax highlighting
 */

import { invariant } from "graphql/jsutils/invariant";

import { isPrintableAsBlockString } from "graphql/language/blockString";
import { Kind } from "graphql/language/kinds";
import { print } from "graphql/language/printer";

import {
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql/type/definition";
import {
  DEFAULT_DEPRECATION_REASON,
  isSpecifiedDirective,
} from "graphql/type/directives";
import { isIntrospectionType } from "graphql/type/introspection";
import { isSpecifiedScalarType } from "graphql/type/scalars";
import { astFromValue } from "graphql/utilities/astFromValue";

export function printSchema(schema) {
  return printFilteredSchema(
    schema,
    (n) => !isSpecifiedDirective(n),
    isDefinedType
  );
}

export function printIntrospectionSchema(schema) {
  return printFilteredSchema(schema, isSpecifiedDirective, isIntrospectionType);
}

function isDefinedType(type) {
  return !isSpecifiedScalarType(type) && !isIntrospectionType(type);
}

function printFilteredSchema(schema, directiveFilter, typeFilter) {
  const directives = schema.getDirectives().filter(directiveFilter);
  const types = Object.values(schema.getTypeMap()).filter(typeFilter);

  return [
    printSchemaDefinition(schema),
    ...directives.map((directive) => printDirective(directive)),
    ...types.map((type) => printType(type)),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function printSchemaDefinition(schema) {
  if (schema.description == null && isSchemaOfCommonNames(schema)) {
    return;
  }

  const operationTypes = [];

  const queryType = schema.getQueryType();
  if (queryType) {
    operationTypes.push(`  query: ${queryType.name}`);
  }

  const mutationType = schema.getMutationType();
  if (mutationType) {
    operationTypes.push(`  mutation: ${mutationType.name}`);
  }

  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    operationTypes.push(`  subscription: ${subscriptionType.name}`);
  }

  return printDescription(schema) + `schema {\n${operationTypes.join("\n")}\n}`;
}

/**
 * GraphQL schema define root types for each type of operation. These types are
 * the same as any other type and can be named in any manner, however there is
 * a common naming convention:
 *
 * ```graphql
 *   schema {
 *     query: Query
 *     mutation: Mutation
 *     subscription: Subscription
 *   }
 * ```
 *
 * When using this naming convention, the schema description can be omitted.
 */
function isSchemaOfCommonNames(schema) {
  const queryType = schema.getQueryType();
  if (queryType && queryType.name !== "Query") {
    return false;
  }

  const mutationType = schema.getMutationType();
  if (mutationType && mutationType.name !== "Mutation") {
    return false;
  }

  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType && subscriptionType.name !== "Subscription") {
    return false;
  }

  return true;
}

export function printType(type) {
  if (isScalarType(type)) {
    return printScalar(type);
  }
  if (isObjectType(type)) {
    return printObject(type);
  }
  if (isInterfaceType(type)) {
    return printInterface(type);
  }
  if (isUnionType(type)) {
    return printUnion(type);
  }
  if (isEnumType(type)) {
    return printEnum(type);
  }
  if (isInputObjectType(type)) {
    return printInputObject(type);
  }
  /* c8 ignore next 3 */
  // Not reachable, all possible types have been considered.
  invariant(false, "Unexpected type: " + inspect(type));
}

function printScalar(type) {
  return (
    printDescription(type) +
    `scalar <span class="graphql-type-name">${type.name}</span>` +
    printSpecifiedByURL(type)
  );
}

function printImplementedInterfaces(type) {
  const interfaces = type.getInterfaces();
  return interfaces.length
    ? " implements " + interfaces.map((i) => i.name).join(" & ")
    : "";
}

function printObject(type) {
  return (
    printDescription(type) +
    `<span class="graphql-keyword">type</span> <span class="graphql-type-name">${type.name}</span>` +
    printImplementedInterfaces(type) +
    printFields(type)
  );
}

function printInterface(type) {
  return (
    printDescription(type) +
    `interface <span class="graphql-type-name">${type.name}</span>` +
    printImplementedInterfaces(type) +
    printFields(type)
  );
}

function printUnion(type) {
  const types = type.getTypes();
  const possibleTypes = types.length
    ? " = " +
      types
        .map((type) => `<span class="graphql-type-name">${type}</span>`)
        .join(" | ")
    : "";
  return (
    printDescription(type) +
    `<span class="graphql-keyword">union</span> ` +
    `<span class="graphql-type-name">${type.name}</span>` +
    possibleTypes
  );
}

function printEnum(type) {
  const values = type
    .getValues()
    .map(
      (value, i) =>
        printDescription(value, "  ", !i) +
        "  " +
        value.name +
        printDeprecated(value.deprecationReason)
    );

  return (
    printDescription(type) +
    `<span class="graphql-keyword">enum</span> <span class="graphql-type-name">${type.name}</span>` +
    printBlock(values)
  );
}

function printInputObject(type) {
  const fields = Object.values(type.getFields()).map(
    (f, i) => printDescription(f, "  ", !i) + "  " + printInputValue(f)
  );
  return (
    printDescription(type) +
    `<span class="graphql-keyword">input</span> <span class="graphql-type-name">${type.name}</span>` +
    printBlock(fields)
  );
}

function printFields(type) {
  const fields = Object.values(type.getFields()).map(
    (f, i) =>
      printDescription(f, "  ", !i) +
      "  " +
      f.name +
      printArgs(f.args, "  ") +
      ": " +
      `<span class="graphql-type-name">${String(f.type)}</span>` +
      printDeprecated(f.deprecationReason)
  );
  return printBlock(fields);
}

function printBlock(items) {
  return items.length !== 0 ? " {\n" + items.join("\n") + "\n}" : "";
}

function printArgs(args, indentation = "") {
  if (args.length === 0) {
    return "";
  }

  // If every arg does not have a description, print them on one line.
  if (args.every((arg) => !arg.description)) {
    return "(" + args.map(printInputValue).join(", ") + ")";
  }

  return (
    "(\n" +
    args
      .map(
        (arg, i) =>
          printDescription(arg, "  " + indentation, !i) +
          "  " +
          indentation +
          printInputValue(arg)
      )
      .join("\n") +
    "\n" +
    indentation +
    ")"
  );
}

function printInputValue(arg) {
  const defaultAST = astFromValue(arg.defaultValue, arg.type);
  let argDecl =
    arg.name +
    ": " +
    `<span class="graphql-type-name">${String(arg.type)}</span>`;
  if (defaultAST) {
    argDecl += ` = ${print(defaultAST)}`;
  }
  return argDecl + printDeprecated(arg.deprecationReason);
}

function printDirective(directive) {
  return (
    printDescription(directive) +
    "directive @" +
    directive.name +
    printArgs(directive.args) +
    (directive.isRepeatable ? " repeatable" : "") +
    " on " +
    directive.locations.join(" | ")
  );
}

function printDeprecated(reason) {
  if (reason == null) {
    return "";
  }
  if (reason !== DEFAULT_DEPRECATION_REASON) {
    const astValue = print({ kind: Kind.STRING, value: reason });
    return ` @deprecated(reason: ${astValue})`;
  }
  return " @deprecated";
}

function printSpecifiedByURL(scalar) {
  if (scalar.specifiedByURL == null) {
    return "";
  }
  const astValue = print({
    kind: Kind.STRING,
    value: scalar.specifiedByURL,
  });
  return ` @specifiedBy(url: ${astValue})`;
}

function printDescription(def, indentation = "", firstInBlock) {
  const { description } = def;
  if (description == null) {
    return "";
  }

  const blockString = print({
    kind: Kind.STRING,
    value: description,
    block: isPrintableAsBlockString(description),
  });

  const prefix =
    indentation && !firstInBlock ? "\n" + indentation : indentation;

  return (
    '<span class="graphql-description">' +
    prefix +
    blockString.replace(/\n/g, "\n" + indentation) +
    "</span>\n"
  );
}
