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
   lastCheckedAt: DateTime
   brokenSince: DateTime
 }
 
 type LinkCheckService {
    checks(urls: [String!]): [LinkCheckResponse!]!
 }
  `;

export const resolvers = {
  LinkCheckService: {
    async checks(parent, args, context, info) {
      if (args.urls.length > 0) {
        return await context.datasources.getLoader("linkcheck").load(args);
      }
      return [];
    },
  },
};
