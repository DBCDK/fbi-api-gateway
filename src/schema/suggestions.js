/**
 * @file SuggestResponse type definition and resolvers
 *
 */

/**
 * The SuggestResponse and SuggestRow type definition
 */
export const typeDef = `
union SuggestRow = Creator | Subject | Work
type SuggestSubject {
  title: String!
}
type SuggestResponse {
  result: [SuggestRow!]!
}`;

/**
 * Resolvers for the SuggestResponse and SuggestRow types
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  SuggestSubject: {
    // title: "hep",
  },
  SuggestRow: {
    __resolveType(parent, args, context, info) {
      return parent.__resolveType;
    },
  },
  SuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.suggester.load({
        ...parent,
        profile: context.profile,
      });

      return res.map(async (row) => {
        if (row.type === "creator") {
          return {
            __resolveType: "Creator",
            value: row.term,
          };
        }
        if (row.type === "subject") {
          return {
            __resolveType: "Subject",
            value: row.term,
          };
        }
        return {
          __resolveType: "Work",
          ...(
            await context.datasources.workservice.load({
              workId: row.work,
              profile: context.profile,
            })
          )?.work,
        };
      });
    },
  },
};
