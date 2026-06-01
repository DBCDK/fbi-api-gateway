/**
 * @file Type definitions and resolvers for RIS reference data
 */

export const typeDef = `
extend type Manifestation {
  """
  Bibliographic reference data for this manifestation formatted as RIS.
  When fetching RIS for multiple manifestations, each record is returned on the
  manifestation. To combine them into a single RIS file, join the records with a newline.
  """
  ris: String
}
`;

export const resolvers = {
  Manifestation: {
    async ris(parent, args, context, info) {
      if (!parent?.pid) {
        return "";
      }

      return context.datasources.getLoader("ris").load({ pid: parent.pid });
    },
  },
};
