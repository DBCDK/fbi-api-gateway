/**
 * @file SearchResponse type definition and resolvers
 *
 */

/**
 * The SearchResponse and SearchResultRow type definition
 */
export const typeDef = `
type SearchResultRow {
  creator: Creator!
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
    creator(parent, args, context, info) {
      return {
        value:
          (parent.debug && parent.debug.creator && parent.debug.creator[0]) ||
          ""
      };
    },
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
      result.forEach(element => {
        element.pids = element.pids.filter(pid => !pid.includes("_"));
      });
      return result.filter(entry => entry.pids.length > 0);
    }
  }
};
