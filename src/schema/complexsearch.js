import { resolveWork } from "../utils/utils";

export const typeDef = `
"""
Search Filters
"""
input ComplexSearchFilters {
  branchId: [String!]
  department: [String!]
  location: [String!]
  sublocation: [String!]
  status: [HoldingsStatus!]
}

"""
The search response
"""
type ComplexSearchResponse {
  """
  Total number of works found. May be used for pagination.
  """
  hitcount: Int!

  """
  The works matching the given search query. Use offset and limit for pagination.
  """
  works(offset: Int! limit: PaginationLimit!): [Work!]!

  """
  Error message, for instance if CQL is invalid
  """
  errorMessage: String
}
`;

export const resolvers = {
  ComplexSearchResponse: {
    async works(parent, args, context) {
      const expanded = await Promise.all(
        parent?.works?.map(async (id) => resolveWork({ id }, context))
      );

      return expanded.filter((work) => !!work);
    },
  },
};
