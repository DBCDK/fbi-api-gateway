import { useState, useEffect, useMemo } from "react";
import { Kind, parse } from "graphql";
import config from "../../../src/config.js";

// Helper function to calculate the depth of a GraphQL AST node
const calculateDepth = (node, currentDepth = 0) => {
  if (!node?.selectionSet?.selections) {
    return currentDepth;
  }

  const depths = node.selectionSet.selections.map((selection) => {
    if (
      selection.kind === Kind.FIELD ||
      selection.kind === Kind.INLINE_FRAGMENT
    ) {
      return calculateDepth(selection, currentDepth + 1);
    }
    return currentDepth;
  });

  return Math.max(...depths);
};

// React hook to calculate the depth of a GraphQL AST node
export default function useQueryDepth(query) {
  const [depth, setDepth] = useState(0);

  // Memoize AST node to avoid recalculating it on every render
  const astNode = useMemo(() => {
    const trimmed = query?.trim();
    if (!trimmed) {
      return null;
    }
    try {
      return parse(trimmed);
    } catch {
      // Incomplete or invalid queries are expected while editing in GraphiQL
      return null;
    }
  }, [query]);

  useEffect(() => {
    if (!astNode?.definitions?.[0]) {
      setDepth(0);
      return;
    }
    setDepth(calculateDepth(astNode.definitions[0]));
  }, [astNode]);

  // const maxDepth = config?.query?.maxDepth;
  const maxDepth = 15;

  return { depth, maxDepth };
}
