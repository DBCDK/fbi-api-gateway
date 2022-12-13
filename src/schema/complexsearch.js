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
    async hitcount(parent, args, context) {
      const res = await context.datasources.getLoader("complexsearch").load({
        offset: 0,
        limit: 10,
        cql: parent.cql,
        profile: context.profile,
      });
      return res?.hitcount || 0;
    },
    async errorMessage(parent, args, context) {
      const res = await context.datasources.getLoader("complexsearch").load({
        offset: 0,
        limit: 10,
        cql: parent.cql,
        profile: context.profile,
      });
      return res?.errorMessage;
    },
    async works(parent, args, context) {
      const res = await context.datasources.getLoader("complexsearch").load({
        ...args,
        offset: args.offset || 0,
        limit: args.limit || 10,
        cql: parent.cql,
        profile: context.profile,
      });
      const expanded = await Promise.all(
        res?.works?.map(async (id) => resolveWork({ id }, context))
      );

      return expanded.filter((work) => !!work);
    },
  },
};
