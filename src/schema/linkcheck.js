/**
 * @file LinkCheck service type definition and resolvers
 *
 */

export const typeDef = `
  enum LinkCheckStatus {
    OK
    BROKEN
    INVALID
    GONE
  }

 type LinkCheckResponse {
   url: String!
   status: LinkCheckStatus!
   lastCheckAt: DateTime
   brokenSince: DateTime
 }
 
 type LinkCheckService {
    checks(urls: [String!]!): [LinkCheckResponse!]!
 }
 
 `;

export const resolvers = {
  LinkCheckService: {
    async checks(parent, args, context, info) {
      const res = await context.datasources.getLoader("linkcheck").load(args);
      return res;
    },
  },
};
