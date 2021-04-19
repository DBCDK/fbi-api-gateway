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
  part: Int!
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
    part(parent, args, context, info) {
      return parent.part || 1;
    },
    title(parent, args, context, info) {
      return "Krimiserien med Kate Burkholder";
    },
    async works(parent, args, context, info) {
      // For now we use these works to be deisplayed in series
      // This will be fixed when we get a series service
      const works = await Promise.all(
        [
          "work-of:870970-basis:51438221",
          "work-of:870970-basis:50980510",
          "work-of:870970-basis:46095464",
          "work-of:870970-basis:46090802",
          "work-of:870970-basis:51578120",
          "work-of:870970-basis:51965906",
          "work-of:870970-basis:52649153",
        ].map(
          async (id) => (await context.datasources.workservice.load(id)).work
        )
      );
      return works.map((entry, index) => ({ ...entry, part: index + 1 }));
    },
  },
};
