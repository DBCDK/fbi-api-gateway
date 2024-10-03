/**
 * @file Type definitions and resolvers for debug
 */

import config from "../config";

// OBS! Complexity should be 0 for all debug fields! - so this dont affect the complexity score
export const typeDef = `
type Complexity {
    value: Int! @complexity(value: 0)
    max: Int! @complexity(value: 0)
    class: String! @complexity(value: 0)
}

type Depth {
    value: Int! @complexity(value: 0)
    max: Int! @complexity(value: 0)
}

type Debug {
  complexity: Complexity! @complexity(value: 0)
  depth: Depth! @complexity(value: 0)
}

extend type Query {
  debug: Debug @complexity(value: 0)
}
`;

export const resolvers = {
  Query: {
    async debug(parent, args, context, info) {
      return {};
    },
  },
  Debug: {
    async complexity(parent, args, context, info) {
      const { queryComplexity, queryComplexityClass } = context;
      const maxComplexity = config?.query?.maxComplexity;
      return {
        value: queryComplexity,
        max: maxComplexity,
        class: queryComplexityClass,
      };
    },
    async depth(parent, args, context, info) {
      const { queryDepth } = context;
      const maxDepth = config?.query?.maxDepth;

      return { value: queryDepth, max: maxDepth };
    },
  },
};
