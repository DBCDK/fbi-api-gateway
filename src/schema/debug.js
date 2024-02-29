/**
 * @file Type definitions and resolvers for debug
 */

// OBS! Complexity should be 0 for all debug fields! - so this dont affect the complexity score
export const typeDef = `
type Complexity {
    value: String! @complexity(value: 0)
    class: String! @complexity(value: 0)
}

type Debug {
  complexity: Complexity! @complexity(value: 0)
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
      return { value: queryComplexity, class: queryComplexityClass };
    },
  },
};
