import { resolveWork } from "../utils/utils";

export const typeDef = `
"""
Search Filters
"""
input ComplexSearchFilters {
  """
  BranchId. 
  """
  branchId: [String!]
  """
  Overall location in library (eg. Voksne).
  """
  department: [String!]
  """
  Where is the book physically located  (eg. skønlitteratur).
  """
  location: [String!]
  """
  More specific location (eg. Fantasy).
  """
  sublocation: [String!]
  """
  Onloan or OnShelf.
  """
  status: [HoldingsStatus!]
  """
  Id of agency.
  """
  agencyId: [String!]
  """
  Name of the branch.
  """
  branch: [String!]
  """
  Local id of the item.
  """
  itemId: [String!]
  """  
  Id of publishing issue.
  """
  issueId: [String!]
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
  works(offset: Int! limit: PaginationLimit!): [Work!]! @complexity(value: 5, multipliers: ["limit"])

  """
  Error message, for instance if CQL is invalid
  """
  errorMessage: String

  """
  the query being executed
  """  
  solrQuery: String
  """
  filter applied to the query
  """
  solrFilter: String
  """
  Time to tokenize query
  """
  tokenizerDurationInMs: Int
  """
  Time for execution on solr
  """
  solrExecutionDurationInMs: Int
}
`;

function setPost(parent, context) {
  return {
    offset: 0,
    limit: 10,
    cql: parent.cql,
    profile: context.profile,
    filters: parent.filters,
  };
}

export const resolvers = {
  ComplexSearchResponse: {
    async hitcount(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));
      return res?.hitcount || 0;
    },
    async errorMessage(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));
      return res?.errorMessage;
    },
    async solrFilter(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));

      return res?.solrFilter;
    },
    async solrQuery(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));

      return res?.solrQuery;
    },

    async solrExecutionDurationInMs(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));

      return res?.solrExecutionDurationInMs;
    },

    async tokenizerDurationInMs(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));

      return res?.tokenizerDurationInMs;
    },

    async works(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context));
      const expanded = await Promise.all(
        res?.works?.map(async (id) => resolveWork({ id }, context))
      );

      return expanded.filter((work) => !!work);
    },
  },
};
