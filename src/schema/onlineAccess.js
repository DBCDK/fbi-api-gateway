/**
 * @file Review type definition and resolvers
 *
 */

import { getBaseUrl } from "../utils/utils";

/**
 * The Review type definitions
 * Review is a union type, and may be ReviewInfomedia,
 * ReviewLitteratursiden or ReviewMatVurd
 */
export const typeDef = `
 type UrlReference {
    url: String!
    origin: String!,
    note: String!
  }
 union OnlineAccess = UrlReference | InfomediaContent
 `;

/**
 * Resolvers for the Review type
 */
export const resolvers = {
  UrlReference: {
    url(parent, args, context, info) {
      return parent.url;
    },
    origin(parent, args, context, info) {
      return getBaseUrl(parent.url);
    },
    async note(parent, args, context, info) {
      return parent.note;
    },
  },
  OnlineAccess: {
    __resolveType(parent, args, context, info) {
      if (parent.url) {
        return "UrlReference";
      } else {
        return "InfomediaContent";
      }
    },
  },
};
