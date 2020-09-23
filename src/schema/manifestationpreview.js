/**
 * @file ManifestationPreview type definition and resolvers
 *
 * Why have a manifestation preview?
 * In a work response these fields are available for every
 * manifestation in the work. hence, we don't need to request openformat
 * for more data.
 *
 * The exception is cover, which will need to request moreinfo.
 * But this may be provided by the work service soon.
 *
 */

/**
 * The ManifestationPreview type definition
 */
export const typeDef = `
    type ManifestationPreview {
      cover: Cover! 
      creators: [String!]!
      description: String
      fullTitle: String
      materialType: String!
      manifestation: Manifestation!
      pid: String!
      subjects: [String!]!
      title: String
    }
  `;

/**
 * Resolvers for the ManifestationPreview type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  ManifestationPreview: {
    cover(parent, args, context, info) {
      // Fetch cover, and pass it to Cover resolver
      return context.datasources.moreinfo.get({
        pid: parent.id
      });
    },
    manifestation(parent, args, context, info) {
      return { pid: parent.id };
    },
    pid(parent, args, context, info) {
      return parent.id;
    }
  }
};
