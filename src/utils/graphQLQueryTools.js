import { parse } from "graphql";

/**
 * Parses a GraphQL query with variables, in order to find field aliases
 * and fields with variables.
 * It traverses the GraphQL Abstract Syntax Tree (AST) and returns a map containing the alias path,
 * the corresponding real path (field name without alias), and resolved arguments.
 *
 * @example
 * const query = `
 *   query Example_IntelligentFacets($q: SearchQueryInput!, $facetsLimit: Int!, $valuesLimit: Int!) {
 *     search(q: $q) {
 *       hitcount
 *       works(offset: 0, limit: 10) {
 *         workId
 *       }
 *       awesomeFacets: intelligentFacets(limit: $facetsLimit) {
 *         name
 *         values(limit: $valuesLimit) {
 *           key
 *           term
 *           score
 *         }
 *       }
 *     }
 *   }
 * `;
 *
 * const variables = {
 *   q: { all: 'harry', creator: 'rowling' },
 *   facetsLimit: 5,
 *   valuesLimit: 5,
 * };
 *
 * const result = findAliasesAndArgs(query, variables);
 * console.log(result);
 *
 * // Output:
 * // {
 * //   search: { realPath: 'search', args: { q: [Object] } },
 * //   'search.works': { realPath: 'search.works', args: { offset: 0, limit: 10 } },
 * //   'search.awesomeFacets': { realPath: 'search.intelligentFacets', args: { limit: 5 } },
 * //   'search.intelligentFacets.values': { realPath: 'search.intelligentFacets.values', args: { limit: 5 } }
 * // }
 */
export function findAliasesAndArgs(query, variables = {}) {
  const ast = parse(query);
  const aliasMap = {};

  /**
   * Traversér AST for finding aliases and variables
   */
  function traverse(node, parentPath = "") {
    if (!node || node.kind !== "Field") return;

    const fieldName = node.name.value;
    const alias = node.alias ? node.alias.value : null;
    const currentPath = parentPath
      ? `${parentPath}.${alias || fieldName}`
      : fieldName;
    const actualPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;

    // Fetch args for the field
    const args = node.arguments.length
      ? node.arguments.reduce((acc, arg) => {
          acc[arg.name.value] = resolveValue(arg.value);
          return acc;
        }, {})
      : null;

    // Only include field with alias or variables
    const hasAlias = !!alias;
    const hasVariables =
      args &&
      Object.values(args).some(
        (value) => value === null || value !== undefined
      );

    if (hasAlias || hasVariables) {
      aliasMap[currentPath] = {
        realPath: actualPath,
        args,
      };
    }

    // Only traverse when there are subfields
    if (node.selectionSet) {
      for (const selection of node.selectionSet.selections) {
        traverse(selection, actualPath);
      }
    }
  }

  /**
   * Resolve a value from a AST ValueNode
   */
  function resolveValue(valueNode) {
    switch (valueNode.kind) {
      case "Variable":
        return variables[valueNode.name.value] || null;
      case "IntValue":
        return parseInt(valueNode.value, 10);
      case "FloatValue":
        return parseFloat(valueNode.value);
      case "StringValue":
        return valueNode.value;
      case "BooleanValue":
        return valueNode.value === "true";
      case "NullValue":
        return null;
      case "ListValue":
        return valueNode.values.map(resolveValue);
      case "ObjectValue":
        return valueNode.fields.reduce((acc, field) => {
          acc[field.name.value] = resolveValue(field.value);
          return acc;
        }, {});
      default:
        return null;
    }
  }

  // Start traversing from root operations
  if (ast.definitions) {
    for (const definition of ast.definitions) {
      if (definition.selectionSet) {
        for (const selection of definition.selectionSet.selections) {
          traverse(selection, "");
        }
      }
    }
  }
  console.log(aliasMap);
  return aliasMap;
}
