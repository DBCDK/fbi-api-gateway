/**
 * @file Help type definition and resolvers
 *
 */

export const typeDef = `
type HelpRow {
  nid: Int!
  group: String!
  orgTitle: String!
  title: String!
  body: String!
}
type HelpResponse {
  result: [HelpRow!]!
}`;

export const resolvers = {
  HelpResponse: {
    async result(parent, args, context, info) {
      return await context.datasources.helptext.load(parent.q);
    },
  },
};
