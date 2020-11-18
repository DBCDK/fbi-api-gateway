/**
 * @file SearchResponse type definition and resolvers
 *
 */

/**
 * The SearchResponse and SearchResultRow type definition
 */
export const typeDef = `
type SearchResultRow {
  title: String!
  work: Work!
}
type SearchResponse {
  result: [SearchResultRow!]!
}`;

/**
 * Resolvers for the SearchResponse and SearchResultRow types
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  SearchResultRow: {
    title(parent, args, context, info) {
      return parent.title || "";
    },
    async work(parent, args, context, info) {
      return (
        await context.datasources.workservice.load(`work-of:${parent.pids[0]}`)
      ).work;
    }
  },
  SearchResponse: {
    async result(parent, args, context, info) {
      const { result } = await context.datasources.simplesearch.load(parent);
      return result;
    }
  }
};
