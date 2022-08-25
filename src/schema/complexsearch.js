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
Search query
"""
input ComplexSearchQuery {
  cql: String!
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
}
`;

export const resolvers = {
  ComplexSearchResponse: {
    async hitcount(parent, args, context) {
      const res = await context.datasources.simplesearch.load({
        q: { all: parent.q.cql },
        filters: parent.filters,
        profile: context.profile,
      });

      return res.hitcount;
    },
    async works(parent, args, context) {
      const res = await context.datasources.simplesearch.load({
        q: { all: parent.q.cql },
        filters: parent.filters,
        ...args,
        profile: context.profile,
      });

      const expanded = await Promise.all(
        res.result.map(async ({ workid }) =>
          resolveWork({ id: workid }, context)
        )
      );

      return expanded.filter((work) => !!work);
    },
  },
};
