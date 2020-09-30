/**
 * @file Series type definition and resolvers
 *
 * Contains mocked data for now
 */

/**
 * The Series type definition
 */
export const typeDef = `
type Series {
  title: String!
  works: [Work!]
}`;

/**
 * Resolvers for the Series type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Series: {
    title(parent, args, context, info) {
      return "Et serienavn";
    },
    async works(parent, args, context, info) {
      const { work } = await context.datasources.workservice.load(
        "work-of:870970-basis:21601470"
      );
      return [work];
    }
  }
};
