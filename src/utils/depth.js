import { GraphQLError, parse } from "graphql";
import config from "../config";

const MAX_QUERY_DEPTH = config.query.maxDepth;

// Funktion til at beregne dybden af en query
function getQueryDepth(node, depth = 0) {
  if (depth > MAX_QUERY_DEPTH) {
    return depth;
  }

  if (!node || !node.selectionSet) {
    return depth;
  }

  const depths = node.selectionSet.selections.map((selection) =>
    getQueryDepth(selection, depth + 1)
  );

  return Math.max(...depths);
}

export function validateQueryDepth(node) {
  // calc depth
  const value = getQueryDepth(node);

  if (value > MAX_QUERY_DEPTH) {
    // operation name
    const operationName = node?.name?.value || "opearation";

    return {
      value,
      statusCode: 400,
      message: `'${operationName}' exceeds maximum operation depth of ${MAX_QUERY_DEPTH}`,
    };
  }

  return {
    value,
    statusCode: 200,
  };
}
