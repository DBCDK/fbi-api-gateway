/**
 * @file SearchResponse type definition and resolvers
 *
 */

/**
 * The SearchResponse and SearchResultRow type definition
 */
export const typeDef = `
type SearchResultRow {
  creator: Creator! @deprecated(reason: "use creators in work")
  title: String! @deprecated(reason: "use title in work")
  work: Work!
}
type SearchResponse {
  hitcount: Int!
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
        value: "",
      };
    },
    title(parent, args, context, info) {
      return "";
    },
  },
  SearchResponse: {
    async hitcount(parent, args, context, info) {
      const { hitcount } = await context.datasources.simplesearch.load(parent);
      return hitcount;
    },
    async result(parent, args, context, info) {
      let { result } = await context.datasources.simplesearch.load(parent);

      // Fetch works
      const expanded = await Promise.all(
        result.map(async (element) => {
          try {
            element.work = (
              await context.datasources.workservice.load(element.workid)
            ).work;
            return element;
          } catch (e) {
            return null;
          }
        })
      );

      // remove works that could not be expanded
      return expanded.filter((element) => !!element);
    },
  },
};
