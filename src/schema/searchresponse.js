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
        value:
          (parent.debug && parent.debug.creator && parent.debug.creator[0]) ||
          "",
      };
    },
    title(parent, args, context, info) {
      return parent.title || "";
    },
  },
  SearchResponse: {
    async hitcount(parent, args, context, info) {
      const { hitcount } = await context.datasources.simplesearch.load(parent);
      return hitcount;
    },
    async result(parent, args, context, info) {
      let { result } = await context.datasources.simplesearch.load(parent);

      // we don't want to look for pids containing '_'
      result.forEach((element) => {
        element.pids = element.pids.filter((pid) => !pid.includes("_"));
      });

      // if the work field is requested we got to expand works
      // maybe some works are not found in work service
      // these should be removed from result
      const requireWorkExpansion = !!info.fieldNodes[0].selectionSet.selections.find(
        (field) => field.name.value === "work"
      );

      if (requireWorkExpansion) {
        // Fetch works
        const expanded = await Promise.all(
          result.map(async (element) => {
            try {
              element.work = (
                await context.datasources.workservice.load(
                  `work-of:${element.pids[0]}`
                )
              ).work;
              return element;
            } catch (e) {
              return null;
            }
          })
        );
        // remove works that could not be expanded
        return expanded.filter((element) => !!element);
      }

      return result.filter((entry) => entry.pids.length > 0);
    },
  },
};
