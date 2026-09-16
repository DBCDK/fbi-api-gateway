import crypto from "crypto";
import {
  getOperationAST,
  GraphQLError,
  isInputObjectType,
  isListType,
  isNonNullType,
  Kind,
  print,
  typeFromAST,
  TypeInfo,
  visit,
  visitWithTypeInfo,
} from "graphql";

function getSelectedDefinitions(document, operationName) {
  const operation = getOperationAST(document, operationName);
  if (!operation) {
    return null;
  }

  const fragments = new Map(
    document.definitions
      .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
      .map((definition) => [definition.name.value, definition])
  );
  const selectedFragments = new Map();

  function collectFragmentSpreads(node) {
    visit(node, {
      FragmentSpread(fragmentSpread) {
        const name = fragmentSpread.name.value;
        if (selectedFragments.has(name)) {
          return false;
        }
        const fragment = fragments.get(name);
        if (fragment) {
          selectedFragments.set(name, fragment);
          collectFragmentSpreads(fragment);
        }
        return false;
      },
    });
  }

  collectFragmentSpreads(operation);

  return {
    operation,
    fragments: [...selectedFragments.values()].sort((a, b) =>
      a.name.value.localeCompare(b.name.value)
    ),
  };
}

export function extractFieldKeys(schema, document, operationName) {
  const selected = getSelectedDefinitions(document, operationName);
  if (!selected) {
    return [];
  }

  const selectedDocument = {
    kind: Kind.DOCUMENT,
    definitions: [selected.operation, ...selected.fragments],
  };
  const fields = new Set();
  const typeInfo = new TypeInfo(schema);

  visit(
    selectedDocument,
    visitWithTypeInfo(typeInfo, {
      Field(node) {
        const fieldName = node.name.value;
        const parentType = typeInfo.getParentType();
        if (parentType && !fieldName.startsWith("__")) {
          fields.add(`${parentType.name}.${fieldName}`);
        }
      },
    })
  );

  return [...fields].sort();
}

function unwrapNonNull(type) {
  return isNonNullType(type) ? type.ofType : type;
}

function collectInputFieldsFromValue(value, type, inputFields) {
  const currentType = unwrapNonNull(type);
  if (value == null || !currentType) return;

  if (isListType(currentType)) {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) =>
      collectInputFieldsFromValue(item, currentType.ofType, inputFields)
    );
    return;
  }

  if (!isInputObjectType(currentType) || typeof value !== "object") return;

  const fieldDefinitions = currentType.getFields();
  Object.keys(value).forEach((fieldName) => {
    const fieldDefinition = fieldDefinitions[fieldName];
    if (!fieldDefinition || fieldName.startsWith("__")) return;
    inputFields.add(`${currentType.name}.${fieldName}`);
    collectInputFieldsFromValue(
      value[fieldName],
      fieldDefinition.type,
      inputFields
    );
  });
}

function collectInputFieldsFromAst(
  valueNode,
  type,
  variables,
  variableTypes,
  inputFields
) {
  const currentType = unwrapNonNull(type);
  if (!valueNode || !currentType) return;

  if (valueNode.kind === Kind.VARIABLE) {
    const variableName = valueNode.name.value;
    if (Object.prototype.hasOwnProperty.call(variables, variableName)) {
      collectInputFieldsFromValue(
        variables[variableName],
        variableTypes.get(variableName) || currentType,
        inputFields
      );
    }
    return;
  }

  if (isListType(currentType)) {
    const values =
      valueNode.kind === Kind.LIST ? valueNode.values : [valueNode];
    values.forEach((item) =>
      collectInputFieldsFromAst(
        item,
        currentType.ofType,
        variables,
        variableTypes,
        inputFields
      )
    );
    return;
  }

  if (!isInputObjectType(currentType) || valueNode.kind !== Kind.OBJECT) return;

  const fieldDefinitions = currentType.getFields();
  valueNode.fields.forEach((fieldNode) => {
    const fieldName = fieldNode.name.value;
    const fieldDefinition = fieldDefinitions[fieldName];
    if (!fieldDefinition || fieldName.startsWith("__")) return;
    inputFields.add(`${currentType.name}.${fieldName}`);
    collectInputFieldsFromAst(
      fieldNode.value,
      fieldDefinition.type,
      variables,
      variableTypes,
      inputFields
    );
  });
}

export function extractInputUsage(
  schema,
  document,
  operationName,
  variables = {}
) {
  const selected = getSelectedDefinitions(document, operationName);
  if (!selected) return { arguments: [], inputFields: [] };

  const selectedDocument = {
    kind: Kind.DOCUMENT,
    definitions: [selected.operation, ...selected.fragments],
  };
  const argumentKeys = new Set();
  const inputFields = new Set();
  const typeInfo = new TypeInfo(schema);
  const variableTypes = new Map(
    (selected.operation.variableDefinitions || []).map((definition) => [
      definition.variable.name.value,
      typeFromAST(schema, definition.type),
    ])
  );

  visit(
    selectedDocument,
    visitWithTypeInfo(typeInfo, {
      Field(node) {
        const parentType = typeInfo.getParentType();
        const fieldDefinition = typeInfo.getFieldDef();
        if (!parentType || !fieldDefinition || node.name.value.startsWith("__")) {
          return;
        }

        node.arguments?.forEach((argumentNode) => {
          const argumentName = argumentNode.name.value;
          const argumentDefinition = fieldDefinition.args.find(
            ({ name }) => name === argumentName
          );
          if (!argumentDefinition || argumentName.startsWith("__")) return;

          argumentKeys.add(
            `${parentType.name}.${fieldDefinition.name}.${argumentName}`
          );
          collectInputFieldsFromAst(
            argumentNode.value,
            argumentDefinition.type,
            variables,
            variableTypes,
            inputFields
          );
        });
      },
    })
  );

  return {
    arguments: [...argumentKeys].sort(),
    inputFields: [...inputFields].sort(),
  };
}

export function extractArgumentKeys(schema, document, operationName) {
  return extractInputUsage(schema, document, operationName).arguments;
}

export function extractInputFieldKeys(
  schema,
  document,
  variables,
  operationName
) {
  return extractInputUsage(schema, document, operationName, variables)
    .inputFields;
}

export function createOperationHash(document, operationName) {
  const selected = getSelectedDefinitions(document, operationName);
  if (!selected) {
    return null;
  }

  const operationWithoutName = {
    ...selected.operation,
    name: undefined,
  };
  const normalizedDocument = {
    kind: Kind.DOCUMENT,
    definitions: [operationWithoutName, ...selected.fragments],
  };
  const digest = crypto
    .createHash("sha256")
    .update(print(normalizedDocument), "utf8")
    .digest("hex");

  return `v1:sha256:${digest}`;
}

export function getTraceqlOutcome(result) {
  if (!result?.errors?.length) {
    return "success";
  }

  const hasInternalError = result.errors.some((error) => {
    let original = error;
    while (original?.originalError) {
      original = original.originalError;
    }
    return !(original instanceof GraphQLError);
  });

  return hasInternalError ? "internal_error" : "graphql_error";
}
