import { useState, useEffect } from "react";
import { Kind } from "graphql";

import config from "../../../src/config.js";

// Helper function to calculate the depth of a GraphQL AST node
const calculateDepth = (node, currentDepth = 0) => {
  // Base case: If the node doesn't have selections, return the current depth
  if (!node.selectionSet || !node.selectionSet.selections) {
    return currentDepth;
  }

  // Recursively calculate the depth of each selection
  const depths = node.selectionSet.selections.map((selection) => {
    if (
      selection.kind === Kind.FIELD ||
      selection.kind === Kind.INLINE_FRAGMENT
    ) {
      return calculateDepth(selection, currentDepth + 1);
    }
    return currentDepth;
  });

  // Return the maximum depth found in the selections
  return Math.max(...depths);
};

// React hook to calculate the depth of a GraphQL AST node
const useQueryDepth = (astNode) => {
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    if (astNode) {
      const calculatedDepth = calculateDepth(astNode);
      setDepth(calculatedDepth);
    }
  }, [astNode]);

  return {
    depth,
    maxDepth: 15,
    // maxDepth: config?.query?.maxDepth
  };
};

export default useQueryDepth;
